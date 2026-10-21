from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Response
from typing import Dict, Any, Optional
import io
import pandas as pd
from ..schemas.schemas import DetectionRequest, AutoAlphaRequest, RecalculateRequest
from ..services.analysis_service import AnalysisService

router = APIRouter(prefix="/api")

# Initialize central analysis service
analysis_service = AnalysisService()

@router.get("/health")
def health_check():
    return {
        "status": "healthy",
        "service": "SignalSense Research Backend",
        "model_loaded": analysis_service.model_suite.baseline.is_loaded,
        "default_dataset": "SWAN-SF",
    }

@router.get("/datasets")
def list_datasets():
    return analysis_service.list_datasets()

@router.get("/datasets/{dataset_id}/metadata")
def get_dataset_metadata(dataset_id: str):
    try:
        return analysis_service.get_metadata(dataset_id)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/datasets/{dataset_id}/preview")
def get_dataset_preview(dataset_id: str, limit: int = Query(50, ge=1, le=500)):
    try:
        return analysis_service.get_preview(dataset_id, limit=limit)
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/upload")
async def upload_csv(file: UploadFile = File(...)):
    if not file.filename.lower().endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only .csv files are supported.")
    try:
        content = await file.read()
        res = analysis_service.register_custom_csv(content, file.filename)
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Unexpected processing error: {str(e)}")

@router.post("/detect")
def run_anomaly_detection(payload: DetectionRequest):
    try:
        return analysis_service.detect(payload.model_dump())
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Inference execution failed: {str(e)}")

@router.post("/alpha/auto")
def auto_select_alpha(payload: AutoAlphaRequest):
    try:
        return analysis_service.auto_alpha(payload.dataset_id, criterion=payload.selection_criterion)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Alpha selection failed: {str(e)}")

@router.post("/recalculate")
def recalculate_scores(payload: RecalculateRequest):
    try:
        return analysis_service.recalculate(payload.model_dump())
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Recalculation failed: {str(e)}")

@router.get("/comparison")
def get_model_comparison(dataset_id: str = "swan"):
    try:
        return analysis_service.get_comparison(dataset_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Could not load comparisons: {str(e)}")

@router.post("/export/csv")
def export_results_csv(payload: Dict[str, Any]):
    try:
        df = pd.DataFrame(payload.get("rows", []))
        buf = io.StringIO()
        df.to_csv(buf, index=False)
        return Response(content=buf.getvalue(), media_type="text/csv")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Export failed: {str(e)}")

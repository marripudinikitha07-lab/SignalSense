from fastapi import APIRouter, UploadFile, File, HTTPException, Query, Response, Depends, status
from typing import Dict, Any, Optional
import io
import re
import pandas as pd
from ..schemas.schemas import (
    DetectionRequest,
    AutoAlphaRequest,
    RecalculateRequest,
    UserRegisterRequest,
    UserLoginRequest,
    TokenResponse,
    UserResponse,
)
from ..services.analysis_service import AnalysisService
from ..database import get_user_by_email, create_user
from ..auth import (
    hash_password,
    verify_password,
    create_access_token,
    get_current_user,
    get_current_user_optional,
)

EMAIL_REGEX = re.compile(r"^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$")


router = APIRouter(prefix="/api")

# Initialize central analysis service
analysis_service = AnalysisService()

# ---------------- Authentication Endpoints ----------------

@router.post("/auth/register", response_model=TokenResponse)
@router.post("/register", response_model=TokenResponse)
def register_user(payload: UserRegisterRequest):
    email = payload.email.strip().lower()
    name = payload.name.strip()
    
    if len(name) < 2:
        raise HTTPException(status_code=400, detail="Name must be at least 2 characters long.")
    
    if not EMAIL_REGEX.match(email):
        raise HTTPException(status_code=400, detail="Please enter a valid email address.")
    
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters long.")
    
    if payload.confirm_password is not None and payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")
    
    existing = get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=400, detail="An account with this email already exists. Please log in.")
    
    hashed = hash_password(payload.password)
    user_record = create_user(name=name, email=email, hashed_password=hashed)
    
    token = create_access_token({"sub": str(user_record["id"]), "email": email, "name": name})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user_record["id"],
            "name": user_record["name"],
            "email": user_record["email"],
        }
    }

@router.post("/auth/login", response_model=TokenResponse)
@router.post("/login", response_model=TokenResponse)
def login_user(payload: UserLoginRequest):
    email = payload.email.strip().lower()
    user = get_user_by_email(email)
    
    if not user or not verify_password(payload.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    token = create_access_token({"sub": str(user["id"]), "email": user["email"], "name": user["name"]})
    
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
        }
    }

@router.get("/auth/me")
@router.get("/me")
def get_authenticated_user(current_user: Dict[str, Any] = Depends(get_current_user)):
    return {"user": current_user}

# ---------------- Anomaly Detection & System Endpoints ----------------


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
def run_anomaly_detection(
    payload: DetectionRequest,
    current_user: Optional[Dict[str, Any]] = Depends(get_current_user_optional),
):
    try:
        res = analysis_service.detect(payload.model_dump())
        if current_user:
            res["authenticated_user"] = current_user["email"]
        return res
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

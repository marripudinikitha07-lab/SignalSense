from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

class DetectionRequest(BaseModel):
    dataset_id: str = "swan"
    model_type: str = "baseline" # "baseline" | "auto_alpha" | "correlation" | "combined"
    feature_name: Optional[str] = "USFLUX"
    alpha_mode: str = "manual" # "manual" | "auto"
    alpha: float = Field(0.5, ge=0.0, le=1.0)
    correlation_weight: float = Field(0.3, ge=0.0, le=1.0)
    anomaly_ratio: float = Field(14.5, ge=0.1, le=50.0)

class AutoAlphaRequest(BaseModel):
    dataset_id: str = "swan"
    selection_criterion: str = "variance_separation"

class RecalculateRequest(BaseModel):
    dataset_id: str = "swan"
    model_type: str = "baseline"
    alpha: float = Field(..., ge=0.0, le=1.0)
    point_scores: List[float]
    sequence_scores: List[float]
    correlation_scores: Optional[List[float]] = None
    correlation_weight: float = 0.3
    anomaly_ratio: float = 14.5

class ExportRequest(BaseModel):
    dataset_id: str
    model_type: str
    feature_name: str
    format: str = "csv"

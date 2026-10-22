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

# --- Authentication Schemas ---

class UserRegisterRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100, description="User full name")
    email: str = Field(..., min_length=5, max_length=150, description="User email address")
    password: str = Field(..., min_length=8, max_length=128, description="User password (min 8 characters)")
    confirm_password: Optional[str] = Field(None, description="Password confirmation")

class UserLoginRequest(BaseModel):
    email: str = Field(..., min_length=5, max_length=150)
    password: str = Field(..., min_length=1, max_length=128)

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    created_at: Optional[str] = None

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse


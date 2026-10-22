import os
import secrets
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import bcrypt
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

# Cryptographically secure secret key resolution
JWT_SECRET = os.environ.get("SIGNALSENSE_JWT_SECRET")
IS_PRODUCTION = os.environ.get("ENVIRONMENT", "").lower() in ["production", "prod"]

if not JWT_SECRET:
    if IS_PRODUCTION:
        raise RuntimeError("CRITICAL SECURITY ERROR: SIGNALSENSE_JWT_SECRET environment variable must be set in production mode.")
    
    # In development, generate a cryptographically secure 256-bit random key
    # and persist it locally in .jwt_secret (ignored by Git) so server restarts don't invalidate tokens
    secret_file = os.path.join(os.path.dirname(__file__), "..", ".jwt_secret")
    if os.path.exists(secret_file):
        try:
            with open(secret_file, "r", encoding="utf-8") as f:
                JWT_SECRET = f.read().strip()
        except Exception:
            JWT_SECRET = None
            
    if not JWT_SECRET or len(JWT_SECRET) < 32:
        JWT_SECRET = secrets.token_hex(32)
        try:
            with open(secret_file, "w", encoding="utf-8") as f:
                f.write(JWT_SECRET)
        except Exception:
            pass  # Fall back to in-memory secure random key

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

def hash_password(password: str) -> str:
    """Hashes a plaintext password using bcrypt with random salt."""
    if not password:
        raise ValueError("Password cannot be empty.")
    salt = bcrypt.gensalt(rounds=12)
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Safely verifies plaintext password against bcrypt hash in constant time."""
    if not plain_password or not hashed_password:
        return False
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """Signs a new JWT with subject, creation time, and expiration."""
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({
        "exp": expire,
        "iat": datetime.utcnow(),
    })
    return jwt.encode(to_encode, JWT_SECRET, algorithm=ALGORITHM)

def verify_access_token(token: str) -> Dict[str, Any]:
    """Validates token signature and expiration, returning decoded payload."""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication token has expired. Please log in again.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication token signature.",
            headers={"WWW-Authenticate": "Bearer"},
        )

# FastAPI HTTPBearer security scheme
security = HTTPBearer(auto_error=False)

def get_current_user(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Dict[str, Any]:
    """FastAPI dependency to extract and authenticate the current user from Bearer token."""
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to access this resource.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    payload = verify_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token credentials.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    from .database import get_user_by_id
    user = get_user_by_id(int(user_id))
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account not found or has been deactivated.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    return {
        "id": user["id"],
        "name": user["name"],
        "email": user["email"],
        "created_at": str(user["created_at"]),
    }

def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[Dict[str, Any]]:
    """FastAPI dependency to optionally extract the authenticated user, or None if unauthenticated."""
    if not credentials or not credentials.credentials:
        return None
    try:
        payload = verify_access_token(credentials.credentials)
        user_id = payload.get("sub")
        if not user_id:
            return None
        from .database import get_user_by_id
        user = get_user_by_id(int(user_id))
        if not user:
            return None
        return {
            "id": user["id"],
            "name": user["name"],
            "email": user["email"],
            "created_at": str(user["created_at"]),
        }
    except HTTPException:
        return None


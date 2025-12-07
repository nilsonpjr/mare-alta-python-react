"""
Dependency module for Multi-Tenancy support
Provides tenant-aware database sessions and user authentication
"""

from fastapi import Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
from typing import Optional
import os

from database import SessionLocal
import models

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", "mare-alta-secret-key-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

def get_db():
    """
    FastAPI dependency to get database session
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """
    Create JWT token with tenant_id embedded
    """
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """
    Verify JWT token and return payload
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

async def get_current_user(
    authorization: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    """
    FastAPI dependency to get current authenticated user
    Validates JWT token and returns User + tenant_id
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    if not authorization:
        raise credentials_exception
    
    # Extract token from "Bearer <token>"
    try:
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise credentials_exception
    except ValueError:
        raise credentials_exception
    
    # Verify token
    payload = verify_token(token)
    if payload is None:
        raise credentials_exception
    
    user_id: int = payload.get("sub")
    tenant_id: int = payload.get("tenant_id")
    
    if user_id is None or tenant_id is None:
        raise credentials_exception
    
    # Fetch user from database
    user = db.query(models.User).filter(
        models.User.id == user_id,
        models.User.tenant_id == tenant_id
    ).first()
    
    if user is None:
        raise credentials_exception
    
    # Attach tenant_id to user object for easy access
    user.current_tenant_id = tenant_id
    return user

async def get_tenant_db(
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    FastAPI dependency to get tenant-filtered database session
    Returns tuple (db, tenant_id, user)
    """
    tenant_id = current_user.current_tenant_id
    return db, tenant_id, current_user

def require_admin(current_user = Depends(get_current_user)):
    """
    Dependency to require ADMIN role
    """
    if current_user.role != models.UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required"
        )
    return current_user

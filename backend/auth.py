from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import os
from dotenv import load_dotenv

import models
import schemas
from database import get_db

load_dotenv()

# Configuração
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-this")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

# --- PASSWORD HASHING ---

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verifica se a senha corresponde ao hash"""
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    """Gera hash da senha"""
    return pwd_context.hash(password)

# --- TOKEN MANAGEMENT ---

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Cria token JWT com tenant_id"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# --- AUTHENTICATION ---

def authenticate_user(db: Session, email: str, password: str):
    """Autentica usuário e retorna com tenant_id"""
    user = db.query(models.User).filter(models.User.email == email).first()
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db)
):
    """Obtém usuário atual a partir do token (com validação de tenant)"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    print(f"DEBUG AUTH: Verifying token: {token[:10]}...")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        tenant_id: int = payload.get("tenant_id")  # NOVO: Extrair tenant_id
        print(f"DEBUG AUTH: Payload decoded. Email: {email}, Tenant: {tenant_id}")
        if email is None or tenant_id is None:
            print("DEBUG AUTH: Email or tenant_id is None")
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except JWTError as e:
        print(f"DEBUG AUTH: JWTError: {str(e)}")
        raise credentials_exception
    
    # NOVO: Validar que o usuário pertence ao tenant do token
    user = db.query(models.User).filter(
        models.User.email == token_data.email,
        models.User.tenant_id == tenant_id
    ).first()
    
    if user is None:
        print(f"DEBUG AUTH: User not found for email {token_data.email} and tenant {tenant_id}")
        raise credentials_exception
    
    print("DEBUG AUTH: User authenticated successfully")
    # Armazenar tenant_id no objeto user para fácil acesso
    user.current_tenant_id = tenant_id
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    """Verifica se usuário está ativo"""
    return current_user

# --- AUTHORIZATION ---

def require_role(allowed_roles: list):
    """Decorator para verificar permissões por role"""
    def role_checker(current_user: models.User = Depends(get_current_active_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not enough permissions"
            )
        return current_user
    return role_checker

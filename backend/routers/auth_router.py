"""
Este módulo define as rotas da API para autenticação de usuários (login, registro)
e gerenciamento de usuários.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm # Usado para lidar com dados de formulário de login.
from sqlalchemy.orm import Session
from datetime import timedelta

# Importa os esquemas de dados (Pydantic), funções CRUD e utilitários de autenticação.
import schemas
import crud
import auth
from database import get_db # Função de dependência para obter a sessão do banco de dados.

# Cria uma instância de APIRouter com um prefixo e tags para organização na documentação OpenAPI.
router = APIRouter(prefix="/api/auth", tags=["Authentication"])

@router.post("/login", response_model=schemas.Token)
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), # Dependência para dados de formulário de login (username e password).
    db: Session = Depends(get_db) # Injeta a sessão do banco de dados.
):
    """
    Endpoint para login de usuário.
    Autentica o usuário e retorna um token de acesso JWT.
    """
    user = auth.authenticate_user(db, form_data.username, form_data.password)
    if not user:
        # Se a autenticação falhar, levanta uma exceção HTTP 401 Não Autorizado.
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos", # Mensagem de erro.
            headers={"WWW-Authenticate": "Bearer"}, # Cabeçalho para informar o tipo de autenticação esperada.
        )
    
    # Define a expiração do token de acesso.
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    # Cria o token de acesso com tenant_id
    access_token = auth.create_access_token(
        data={
            "sub": user.email,
            "tenant_id": user.tenant_id  # NOVO: Incluir tenant_id no token
        }, 
        expires_delta=access_token_expires
    )
    
    # Retorna o token de acesso e o tipo do token.
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=schemas.User)
def read_users_me(current_user: schemas.User = Depends(auth.get_current_active_user)):
    """
    Endpoint para obter informações do usuário atualmente logado.
    Requer autenticação via token JWT.
    """
    # 'get_current_active_user' é uma dependência que verifica o token e retorna o usuário autenticado.
    return current_user

@router.post("/register", response_model=schemas.User)
def register(
    user: schemas.UserCreate, # Dados do usuário para registro.
    db: Session = Depends(get_db) # Injeta a sessão do banco de dados.
):
    """
    Endpoint para registrar um novo usuário.
    Apenas um usuário com permissão de Administrador (que o crie) pode usar isso no fluxo atual.
    """
    # Verifica se o email já está registrado.
    db_user = crud.get_user_by_email(db, email=user.email)
    if db_user:
        # Se o email já existe, levanta uma exceção HTTP 400 Bad Request.
        raise HTTPException(status_code=400, detail="Email já registrado")
    # Cria o usuário no banco de dados e o retorna.
    return crud.create_user(db=db, user=user)

"""
Este módulo define as rotas da API para gerenciamento de clientes.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Importa os esquemas de dados (Pydantic), funções CRUD e utilitários de autenticação.
import schemas
import crud
import auth
from database import get_db # Função de dependência para obter a sessão do banco de dados.

# Cria uma instância de APIRouter com um prefixo e tags para organização na documentação OpenAPI.
router = APIRouter(prefix="/api/clients", tags=["Clientes"])

@router.get("", response_model=List[schemas.Client])
def get_all_clients(
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Retorna uma lista de todos os clientes.
    Requer autenticação.
    """
    # Chama a função CRUD para obter os clientes do banco de dados.
    return crud.get_clients(db)

@router.post("", response_model=schemas.Client)
def create_new_client(
    client: schemas.ClientCreate, # Dados do novo cliente.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Cria um novo cliente no sistema.
    Requer autenticação.
    """
    # Chama a função CRUD para criar o cliente no banco de dados.
    return crud.create_client(db, client)

"""
Este módulo define as rotas da API para gerenciamento de transações financeiras
(receitas e despesas).
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
router = APIRouter(prefix="/api/transactions", tags=["Transações Financeiras"])

@router.get("", response_model=List[schemas.Transaction])
def get_all_transactions(
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Lista todas as transações financeiras registradas.
    Requer autenticação.
    """
    # Chama a função CRUD para obter todas as transações do banco de dados.
    return crud.get_transactions(db)

@router.post("", response_model=schemas.Transaction)
def create_new_transaction(
    transaction: schemas.TransactionCreate, # Dados da nova transação para criação.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Cria uma nova transação financeira no sistema.
    Requer autenticação.
    """
    # Chama a função CRUD para criar a transação no banco de dados.
    return crud.create_transaction(db=db, transaction=transaction)

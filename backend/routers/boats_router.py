"""
Este módulo define as rotas da API para gerenciamento de embarcações.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional

# Importa os esquemas de dados (Pydantic), funções CRUD e utilitários de autenticação.
import schemas
import crud
import auth
from database import get_db # Função de dependência para obter a sessão do banco de dados.

# Cria uma instância de APIRouter com um prefixo e tags para organização na documentação OpenAPI.
router = APIRouter(prefix="/api/boats", tags=["Embarcações"])

@router.get("", response_model=List[schemas.Boat])
def get_all_boats(
    client_id: Optional[int] = None, # Parâmetro de query opcional para filtrar embarcações por cliente.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Retorna uma lista de todas as embarcações, opcionalmente filtradas por client_id.
    Requer autenticação.
    """
    # Chama a função CRUD para obter as embarcações do banco de dados.
    return crud.get_boats(db, client_id=client_id)

@router.post("", response_model=schemas.Boat)
def create_new_boat(
    boat: schemas.BoatCreate, # Dados da nova embarcação, incluindo motores.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Cria uma nova embarcação no sistema.
    Requer autenticação.
    """
    # Chama a função CRUD para criar a embarcação no banco de dados.
    return crud.create_boat(db, boat, tenant_id=current_user.tenant_id)

@router.get("/{boat_id}", response_model=schemas.Boat)
def get_single_boat(
    boat_id: int,
    db: Session = Depends(get_db),
    current_user: schemas.User = Depends(auth.get_current_active_user)
):
    """
    Retorna uma embarcação específica pelo ID.
    Requer autenticação.
    """
    boat = crud.get_boat(db, boat_id=boat_id)
    if not boat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Embarcação não encontrada")
    return boat

@router.put("/{boat_id}", response_model=schemas.Boat)
def update_existing_boat(
    boat_id: int, # ID da embarcação a ser atualizada, passado como parâmetro de caminho.
    boat: schemas.BoatUpdate, # Dados de atualização para a embarcação e seus motores.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Atualiza uma embarcação existente pelo seu ID.
    Requer autenticação.
    Levanta um HTTPException 404 se a embarcação não for encontrada.
    """
    # Chama a função CRUD para atualizar a embarcação no banco de dados.
    db_boat = crud.update_boat(db, boat_id=boat_id, boat_update=boat)
    if db_boat is None:
        # Se a função CRUD retornar None, a embarcação não foi encontrada.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Embarcação não encontrada")
    return db_boat

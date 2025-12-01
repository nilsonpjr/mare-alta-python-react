"""
Este módulo define as rotas da API para gerenciamento de configurações da aplicação,
incluindo fabricantes, modelos e informações da empresa.
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
router = APIRouter(prefix="/api/config", tags=["Configuração"])

# --- MANUFACTURERS (Fabricantes) ---
# Endpoints para gerenciar fabricantes de embarcações e motores.

@router.get("/manufacturers", response_model=List[schemas.Manufacturer])
def get_all_manufacturers(
    type: Optional[str] = None, # Parâmetro de query opcional para filtrar fabricantes por tipo ("BOAT" ou "ENGINE").
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Retorna uma lista de todos os fabricantes, opcionalmente filtrados por tipo.
    Requer autenticação.
    """
    # Chama a função CRUD para obter os fabricantes do banco de dados.
    return crud.get_manufacturers(db, type=type)

@router.post("/manufacturers", response_model=schemas.Manufacturer)
def create_new_manufacturer(
    manufacturer: schemas.ManufacturerCreate, # Dados do novo fabricante para criação.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Cria um novo fabricante no sistema.
    Requer autenticação.
    """
    # Chama a função CRUD para criar o fabricante no banco de dados.
    return crud.create_manufacturer(db, manufacturer)

@router.delete("/manufacturers/{id}")
def delete_existing_manufacturer(
    id: int, # ID do fabricante a ser deletado, passado como parâmetro de caminho.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Deleta um fabricante existente pelo seu ID.
    Requer autenticação.
    Levanta um HTTPException 404 se o fabricante não for encontrado.
    """
    # Chama a função CRUD para deletar o fabricante.
    result = crud.delete_manufacturer(db, id)
    if not result:
        # Se a função CRUD retornar None, o fabricante não foi encontrado.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Fabricante não encontrado")
    return {"status": "success", "message": "Fabricante deletado com sucesso"}

# --- MODELS (Modelos) ---
# Endpoints para gerenciar modelos associados a fabricantes.

@router.post("/manufacturers/{id}/models", response_model=schemas.Model)
def create_new_model(
    id: int, # ID do fabricante ao qual o modelo será associado.
    model: schemas.ModelCreate, # Dados do novo modelo para criação.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Cria um novo modelo e o associa a um fabricante existente.
    Requer autenticação.
    """
    # Chama a função CRUD para criar o modelo no banco de dados.
    return crud.create_model(db, id, model)

@router.delete("/models/{id}")
def delete_existing_model(
    id: int, # ID do modelo a ser deletado, passado como parâmetro de caminho.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Deleta um modelo existente pelo seu ID.
    Requer autenticação.
    Levanta um HTTPException 404 se o modelo não for encontrado.
    """
    # Chama a função CRUD para deletar o modelo.
    result = crud.delete_model(db, id)
    if not result:
        # Se a função CRUD retornar None, o modelo não foi encontrado.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Modelo não encontrado")
    return {"status": "success", "message": "Modelo deletado com sucesso"}

# --- COMPANY INFO (Informações da Empresa) ---
# Endpoints para gerenciar as informações da própria empresa.

@router.get("/company", response_model=Optional[schemas.CompanyInfo])
def get_company_information(
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Retorna as informações da empresa.
    Requer autenticação.
    """
    # Chama a função CRUD para obter as informações da empresa.
    return crud.get_company_info(db)

@router.put("/company", response_model=schemas.CompanyInfo)
def update_company_information(
    info: schemas.CompanyInfoCreate, # Dados de atualização para as informações da empresa.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Atualiza as informações da empresa. Se não existirem, uma nova entrada é criada.
    Requer autenticação.
    """
    # Chama a função CRUD para atualizar ou criar as informações da empresa.
    return crud.update_company_info(db, info)

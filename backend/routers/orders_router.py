"""
Este módulo define as rotas da API para gerenciamento de Ordens de Serviço (OS).
Ele inclui funcionalidades para criar, ler, atualizar e completar ordens,
bem como adicionar itens e notas a elas.
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
router = APIRouter(prefix="/api/orders", tags=["Ordens de Serviço"])

@router.get("", response_model=List[schemas.ServiceOrder])
def get_all_service_orders(
    status: Optional[str] = None, # Parâmetro de query opcional para filtrar ordens por status.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Retorna uma lista de todas as ordens de serviço, opcionalmente filtradas por status.
    Requer autenticação.
    """
    # Chama a função CRUD para buscar as ordens de serviço do banco de dados.
    return crud.get_orders(db, status=status)

@router.get("/{order_id}", response_model=schemas.ServiceOrder)
def get_single_service_order(
    order_id: int, # ID da ordem de serviço a ser buscada.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Retorna uma ordem de serviço específica pelo seu ID.
    Requer autenticação.
    Levanta um HTTPException 404 se a ordem não for encontrada.
    """
    # Chama a função CRUD para buscar a ordem de serviço.
    order = crud.get_order(db, order_id=order_id)
    if not order:
        # Se a função CRUD retornar None, a ordem não foi encontrada.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordem de Serviço não encontrada")
    return order

@router.post("", response_model=schemas.ServiceOrder)
def create_new_service_order(
    order: schemas.ServiceOrderCreate, # Dados da nova ordem de serviço para criação.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Cria uma nova ordem de serviço no sistema.
    Requer autenticação.
    """
    # Chama a função CRUD para criar a ordem de serviço.
    return crud.create_order(db=db, order=order)

@router.put("/{order_id}", response_model=schemas.ServiceOrder)
def update_existing_service_order(
    order_id: int, # ID da ordem de serviço a ser atualizada.
    order_update: schemas.ServiceOrderUpdate, # Dados de atualização para a ordem de serviço.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Atualiza os dados de uma ordem de serviço existente pelo seu ID.
    Requer autenticação.
    Levanta um HTTPException 404 se a ordem não for encontrada.
    """
    # Chama a função CRUD para atualizar a ordem de serviço.
    updated_order = crud.update_order(db, order_id=order_id, order_update=order_update)
    if not updated_order:
        # Se a função CRUD retornar None, a ordem não foi encontrada.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordem de Serviço não encontrada")
    return updated_order

@router.post("/{order_id}/items", response_model=schemas.ServiceOrder)
def add_item_to_service_order(
    order_id: int, # ID da ordem de serviço à qual o item será adicionado.
    item: schemas.ServiceItemCreate, # Dados do item (peça ou serviço) a ser adicionado.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Adiciona um item (peça ou serviço) a uma ordem de serviço existente.
    Recalcula o valor total da ordem.
    Requer autenticação.
    Levanta um HTTPException 404 se a ordem não for encontrada.
    """
    # Chama a função CRUD para adicionar o item e atualizar a ordem.
    order = crud.add_order_item(db, order_id=order_id, item=item)
    if not order:
        # Se a função CRUD retornar None (o que pode acontecer se a OS não existir), levanta erro.
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Ordem de Serviço não encontrada")
    return order

@router.post("/{order_id}/notes", response_model=schemas.OrderNote)
def add_note_to_service_order(
    order_id: int, # ID da ordem de serviço à qual a nota será adicionada.
    note: schemas.OrderNoteCreate, # Dados da nota a ser adicionada.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Adiciona uma nota a uma ordem de serviço existente.
    Requer autenticação.
    """
    # Chama a função CRUD para adicionar a nota.
    return crud.add_order_note(db, order_id=order_id, note=note)

@router.put("/{order_id}/complete", response_model=schemas.ServiceOrder)
def complete_service_order(
    order_id: int, # ID da ordem de serviço a ser completada.
    db: Session = Depends(get_db), # Injeta a sessão do banco de dados.
    current_user: schemas.User = Depends(auth.get_current_active_user) # Garante que o usuário esteja autenticado.
):
    """
    Marca uma ordem de serviço como completa.
    Esta operação também realiza a baixa de estoque das peças utilizadas e gera uma transação de receita.
    Requer autenticação.
    Levanta um HTTPException 400 se a ordem não puder ser completada (ex: já completada ou não encontrada).
    """
    # Chama a função CRUD para completar a ordem de serviço.
    order = crud.complete_order(db, order_id=order_id)
    if not order:
        # Se a função CRUD retornar None, a ordem não pode ser completada.
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Não foi possível completar a Ordem de Serviço (verifique se já está completa ou se existe).")
    return order

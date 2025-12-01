"""
Este arquivo contém as funções CRUD (Create, Read, Update, Delete)
para interagir com o banco de dados. Cada função é responsável por
uma operação específica em um modelo SQLAlchemy, utilizando uma sessão de banco de dados.
"""

from sqlalchemy.orm import Session, joinedload
from sqlalchemy import desc
from datetime import datetime
from typing import List, Optional

import models
import schemas
from auth import get_password_hash # Importa a função para hash de senhas

# --- USER CRUD ---
# Funções para operações CRUD na tabela de usuários (models.User).

def get_user_by_email(db: Session, email: str):
    """
    Busca um usuário pelo endereço de email.
    Args:
        db (Session): Sessão do banco de dados.
        email (str): Endereço de email do usuário.
    Returns:
        models.User: O objeto usuário, se encontrado, ou None.
    """
    return db.query(models.User).filter(models.User.email == email).first()

def create_user(db: Session, user: schemas.UserCreate):
    """
    Cria um novo usuário no banco de dados.
    Args:
        db (Session): Sessão do banco de dados.
        user (schemas.UserCreate): Dados do usuário para criação, incluindo senha em texto plano.
    Returns:
        models.User: O objeto usuário recém-criado.
    """
    hashed_password = get_password_hash(user.password) # Gera o hash da senha antes de armazenar.
    db_user = models.User(
        email=user.email,
        name=user.name,
        hashed_password=hashed_password,
        role=user.role,
        client_id=user.client_id
    )
    db.add(db_user) # Adiciona o novo usuário à sessão.
    db.commit() # Confirma a transação no banco de dados.
    db.refresh(db_user) # Atualiza o objeto com os dados do banco (ex: ID gerado).
    return db_user

# --- CLIENT CRUD ---
# Funções para operações CRUD na tabela de clientes (models.Client).

def get_clients(db: Session, skip: int = 0, limit: int = 100):
    """
    Retorna uma lista de clientes.
    Args:
        db (Session): Sessão do banco de dados.
        skip (int): Número de registros a pular (offset para paginação).
        limit (int): Número máximo de registros a retornar.
    Returns:
        List[models.Client]: Lista de objetos cliente.
    """
    return db.query(models.Client).offset(skip).limit(limit).all()

def get_client(db: Session, client_id: int):
    """
    Busca um cliente pelo ID.
    Args:
        db (Session): Sessão do banco de dados.
        client_id (int): ID do cliente.
    Returns:
        models.Client: O objeto cliente, se encontrado, ou None.
    """
    return db.query(models.Client).filter(models.Client.id == client_id).first()

def create_client(db: Session, client: schemas.ClientCreate):
    """
    Cria um novo cliente no banco de dados.
    Args:
        db (Session): Sessão do banco de dados.
        client (schemas.ClientCreate): Dados do cliente para criação.
    Returns:
        models.Client: O objeto cliente recém-criado.
    """
    db_client = models.Client(**client.model_dump()) # Cria uma instância do modelo Client a partir do schema.
    db.add(db_client)
    db.commit()
    db.refresh(db_client)
    return db_client

# --- MARINA CRUD ---
# Funções para operações CRUD na tabela de marinas (models.Marina).

def get_marinas(db: Session):
    """
    Retorna uma lista de todas as marinas.
    Args:
        db (Session): Sessão do banco de dados.
    Returns:
        List[models.Marina]: Lista de objetos marina.
    """
    return db.query(models.Marina).all()

def create_marina(db: Session, marina: schemas.MarinaCreate):
    """
    Cria uma nova marina no banco de dados.
    Args:
        db (Session): Sessão do banco de dados.
        marina (schemas.MarinaCreate): Dados da marina para criação.
    Returns:
        models.Marina: O objeto marina recém-criada.
    """
    db_marina = models.Marina(**marina.model_dump())
    db.add(db_marina)
    db.commit()
    db.refresh(db_marina)
    return db_marina

# --- BOAT CRUD ---
# Funções para operações CRUD na tabela de embarcações (models.Boat).

def get_boats(db: Session, client_id: Optional[int] = None):
    """
    Retorna uma lista de embarcações, opcionalmente filtrada por ID do cliente.
    Args:
        db (Session): Sessão do banco de dados.
        client_id (Optional[int]): ID do cliente para filtrar as embarcações.
    Returns:
        List[models.Boat]: Lista de objetos embarcação.
    """
    query = db.query(models.Boat)
    if client_id:
        query = query.filter(models.Boat.client_id == client_id)
    return query.all()

def get_boat(db: Session, boat_id: int):
    """
    Busca uma embarcação pelo ID.
    Args:
        db (Session): Sessão do banco de dados.
        boat_id (int): ID da embarcação.
    Returns:
        models.Boat: O objeto embarcação, se encontrado, ou None.
    """
    return db.query(models.Boat).filter(models.Boat.id == boat_id).first()

def create_boat(db: Session, boat: schemas.BoatCreate):
    """
    Cria uma nova embarcação e seus motores associados.
    Args:
        db (Session): Sessão do banco de dados.
        boat (schemas.BoatCreate): Dados da embarcação para criação, incluindo lista de motores.
    Returns:
        models.Boat: O objeto embarcação recém-criado com seus motores.
    """
    boat_data = boat.model_dump(exclude={'engines'}) # Exclui 'engines' pois serão adicionados separadamente.
    db_boat = models.Boat(**boat_data)
    db.add(db_boat)
    db.flush() # Salva a embarcação para obter seu ID antes de adicionar os motores.

    for engine_data in boat.engines:
        db_engine = models.Engine(**engine_data.model_dump(), boat_id=db_boat.id)
        db.add(db_engine)

    db.commit()
    db.refresh(db_boat)
    return db_boat

def update_boat(db: Session, boat_id: int, boat_update: schemas.BoatUpdate):
    """
    Atualiza os dados de uma embarcação e sincroniza seus motores.
    Args:
        db (Session): Sessão do banco de dados.
        boat_id (int): ID da embarcação a ser atualizada.
        boat_update (schemas.BoatUpdate): Dados de atualização da embarcação e lista de motores.
    Returns:
        models.Boat: O objeto embarcação atualizado, ou None se não encontrada.
    """
    db_boat = get_boat(db, boat_id)
    if not db_boat:
        return None

    update_data = boat_update.model_dump(exclude_unset=True, exclude={'engines'})
    for key, value in update_data.items():
        setattr(db_boat, key, value)

    # Sincronização de motores: adicionar novos, atualizar existentes, remover os que não estão na lista.
    if boat_update.engines is not None:
        existing_engine_ids = {engine.id for engine in db_boat.engines}
        incoming_engine_ids = {engine.id for engine in boat_update.engines if engine.id}

        # Deleta motores que não estão mais na lista de entrada
        for engine_id in existing_engine_ids - incoming_engine_ids:
            engine_to_delete = db.query(models.Engine).filter(models.Engine.id == engine_id).first()
            if engine_to_delete: # Verifica se o motor existe antes de deletar
                db.delete(engine_to_delete)

        # Atualiza motores existentes ou cria novos
        for engine_data in boat_update.engines:
            if engine_data.id: # Motor existente (possui ID)
                db_engine = db.query(models.Engine).filter(models.Engine.id == engine_data.id).first()
                if db_engine:
                    for key, value in engine_data.model_dump(exclude_unset=True).items():
                        setattr(db_engine, key, value)
            else: # Novo motor (não possui ID)
                new_engine = models.Engine(**engine_data.model_dump(exclude={'id'}), boat_id=db_boat.id)
                db.add(new_engine)

    db.commit()
    db.refresh(db_boat)
    return db_boat

# --- PART CRUD ---
# Funções para operações CRUD na tabela de peças (models.Part).

def get_parts(db: Session):
    """
    Retorna uma lista de todas as peças.
    Args:
        db (Session): Sessão do banco de dados.
    Returns:
        List[models.Part]: Lista de objetos peça.
    """
    return db.query(models.Part).all()

def get_part(db: Session, part_id: int):
    """
    Busca uma peça pelo ID.
    Args:
        db (Session): Sessão do banco de dados.
        part_id (int): ID da peça.
    Returns:
        models.Part: O objeto peça, se encontrado, ou None.
    """
    return db.query(models.Part).filter(models.Part.id == part_id).first()

def get_part_by_sku(db: Session, sku: str):
    """
    Busca uma peça pelo SKU.
    Args:
        db (Session): Sessão do banco de dados.
        sku (str): SKU da peça.
    Returns:
        models.Part: O objeto peça, se encontrado, ou None.
    """
    return db.query(models.Part).filter(models.Part.sku == sku).first()

def create_part(db: Session, part: schemas.PartCreate):
    """
    Cria uma nova peça no banco de dados.
    Args:
        db (Session): Sessão do banco de dados.
        part (schemas.PartCreate): Dados da peça para criação.
    Returns:
        models.Part: O objeto peça recém-criada.
    """
    db_part = models.Part(**part.model_dump())
    db.add(db_part)
    db.commit()
    db.refresh(db_part)
    return db_part

def update_part(db: Session, part_id: int, part_update: schemas.PartUpdate):
    """
    Atualiza os dados de uma peça.
    Args:
        db (Session): Sessão do banco de dados.
        part_id (int): ID da peça a ser atualizada.
        part_update (schemas.PartUpdate): Dados de atualização da peça.
    Returns:
        models.Part: O objeto peça atualizado, ou None se não encontrada.
    """
    db_part = get_part(db, part_id)
    if not db_part:
        return None
    
    update_data = part_update.model_dump(exclude_unset=True) # Obtém apenas os campos que foram definidos no schema de atualização.
    for key, value in update_data.items():
        setattr(db_part, key, value) # Atualiza os atributos do objeto do banco de dados.
    
    db.commit()
    db.refresh(db_part)
    return db_part

# --- SERVICE ORDER CRUD ---
# Funções para operações CRUD na tabela de ordens de serviço (models.ServiceOrder).

def get_orders(db: Session, status: Optional[str] = None):
    """
    Retorna uma lista de ordens de serviço, opcionalmente filtrada por status.
    Carrega os itens e notas relacionadas para evitar N+1 queries.
    Args:
        db (Session): Sessão do banco de dados.
        status (Optional[str]): Status da OS para filtrar.
    Returns:
        List[models.ServiceOrder]: Lista de objetos ordem de serviço.
    """
    query = db.query(models.ServiceOrder).options(
        joinedload(models.ServiceOrder.items), # Carrega os itens da OS
        joinedload(models.ServiceOrder.notes) # Carrega as notas da OS
    ).order_by(desc(models.ServiceOrder.created_at)) # Ordena pelas mais recentes
    if status:
        query = query.filter(models.ServiceOrder.status == status)
    return query.all()

def get_order(db: Session, order_id: int):
    """
    Busca uma ordem de serviço pelo ID.
    Carrega os itens e notas relacionadas.
    Args:
        db (Session): Sessão do banco de dados.
        order_id (int): ID da ordem de serviço.
    Returns:
        models.ServiceOrder: O objeto ordem de serviço, se encontrado, ou None.
    """
    return db.query(models.ServiceOrder).options(
        joinedload(models.ServiceOrder.items),
        joinedload(models.ServiceOrder.notes)
    ).filter(models.ServiceOrder.id == order_id).first()

def create_order(db: Session, order: schemas.ServiceOrderCreate):
    """
    Cria uma nova ordem de serviço no banco de dados.
    Args:
        db (Session): Sessão do banco de dados.
        order (schemas.ServiceOrderCreate): Dados da ordem de serviço para criação.
    Returns:
        models.ServiceOrder: O objeto ordem de serviço recém-criado.
    """
    db_order = models.ServiceOrder(**order.model_dump())
    db.add(db_order)
    db.commit()
    db.refresh(db_order)
    return db_order

def update_order(db: Session, order_id: int, order_update: schemas.ServiceOrderUpdate):
    """
    Atualiza os dados de uma ordem de serviço.
    Args:
        db (Session): Sessão do banco de dados.
        order_id (int): ID da ordem de serviço a ser atualizada.
        order_update (schemas.ServiceOrderUpdate): Dados de atualização da ordem de serviço.
    Returns:
        models.ServiceOrder: O objeto ordem de serviço atualizado, ou None se não encontrada.
    """
    db_order = get_order(db, order_id)
    if not db_order:
        return None
    
    update_data = order_update.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_order, key, value)
    
    db.commit()
    db.refresh(db_order)
    return db_order

def add_order_item(db: Session, order_id: int, item: schemas.ServiceItemCreate):
    """
    Adiciona um item a uma ordem de serviço e recalcula o valor total da OS.
    Args:
        db (Session): Sessão do banco de dados.
        order_id (int): ID da ordem de serviço.
        item (schemas.ServiceItemCreate): Dados do item a ser adicionado.
    Returns:
        models.ServiceOrder: A ordem de serviço atualizada com o novo item e total recalculado.
    """
    db_item = models.ServiceItem(**item.model_dump(), order_id=order_id)
    db.add(db_item)
    
    # Recalcula o total da ordem de serviço.
    db_order = get_order(db, order_id) # Pega a OS com os itens carregados para recalcular o total.
    if db_order: # Verifica se a OS foi encontrada
        # Soma o total de todos os itens existentes e adiciona o total do novo item.
        db_order.total_value = sum(i.total for i in db_order.items if i.id != db_item.id) + db_item.total
    
    db.commit()
    db.refresh(db_order) # Refresh para garantir que o total_value atualizado esteja no objeto.
    db.refresh(db_item) # Refresh para garantir que o item adicionado esteja no objeto.
    return db_order

def add_order_note(db: Session, order_id: int, note: schemas.OrderNoteCreate):
    """
    Adiciona uma nota a uma ordem de serviço.
    Args:
        db (Session): Sessão do banco de dados.
        order_id (int): ID da ordem de serviço.
        note (schemas.OrderNoteCreate): Dados da nota a ser adicionada.
    Returns:
        models.OrderNote: O objeto nota recém-criado.
    """
    db_note = models.OrderNote(**note.model_dump(), order_id=order_id)
    db.add(db_note)
    db.commit()
    db.refresh(db_note)
    return db_note

def complete_order(db: Session, order_id: int):
    """
    Completa uma ordem de serviço:
    - Muda o status da OS para "Concluído".
    - Baixa as peças do estoque.
    - Registra os movimentos de estoque.
    - Gera uma transação de receita.
    Args:
        db (Session): Sessão do banco de dados.
        order_id (int): ID da ordem de serviço a ser completada.
    Returns:
        models.ServiceOrder: A ordem de serviço completada, ou None se não encontrada ou já completada.
    """
    db_order = get_order(db, order_id)
    if not db_order or db_order.status == models.OSStatus.COMPLETED:
        return None
    
    # Muda o status da ordem de serviço para CONCLUÍDO.
    db_order.status = models.OSStatus.COMPLETED
    
    # Baixa o estoque das peças utilizadas na ordem de serviço.
    for item in db_order.items:
        if item.type == models.ItemType.PART and item.part_id: # Se o item for uma peça e tiver um part_id
            part = get_part(db, item.part_id)
            if part:
                part.quantity = max(0, part.quantity - item.quantity) # Garante que a quantidade não seja negativa.
                
                # Registra o movimento de saída no estoque.
                movement = models.StockMovement(
                    part_id=part.id,
                    type=models.MovementType.OUT_OS,
                    quantity=item.quantity,
                    description=f"Saída OS #{order_id}",
                    reference_id=str(order_id),
                    user="Sistema" # O usuário deveria vir do contexto de autenticação real.
                )
                db.add(movement)
    
    # Gera uma transação financeira de receita para a ordem de serviço.
    transaction = models.Transaction(
        type="INCOME",
        category="Serviços", # Categoria padrão, pode ser mais granular.
        description=f"Recebimento OS #{order_id}",
        amount=db_order.total_value,
        date=datetime.utcnow(),
        status="PENDING", # Status inicial da receita (pendente de recebimento).
        order_id=order_id
    )
    db.add(transaction)
    
    db.commit()
    db.refresh(db_order)
    return db_order

# --- TRANSACTION CRUD ---
# Funções para operações CRUD na tabela de transações (models.Transaction).

def get_transactions(db: Session):
    """
    Retorna uma lista de todas as transações financeiras, ordenadas por data.
    Args:
        db (Session): Sessão do banco de dados.
    Returns:
        List[models.Transaction]: Lista de objetos transação.
    """
    return db.query(models.Transaction).order_by(desc(models.Transaction.date)).all()

def create_transaction(db: Session, transaction: schemas.TransactionCreate):
    """
    Cria uma nova transação financeira no banco de dados.
    Args:
        db (Session): Sessão do banco de dados.
        transaction (schemas.TransactionCreate): Dados da transação para criação.
    Returns:
        models.Transaction: O objeto transação recém-criado.
    """
    db_transaction = models.Transaction(**transaction.model_dump())
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    return db_transaction

# --- STOCK MOVEMENT CRUD ---
# Funções para operações CRUD na tabela de movimentos de estoque (models.StockMovement).

def get_movements(db: Session, part_id: Optional[int] = None):
    """
    Retorna uma lista de movimentos de estoque, opcionalmente filtrada por ID da peça.
    Args:
        db (Session): Sessão do banco de dados.
        part_id (Optional[int]): ID da peça para filtrar os movimentos.
    Returns:
        List[models.StockMovement]: Lista de objetos movimento de estoque.
    """
    query = db.query(models.StockMovement).order_by(desc(models.StockMovement.date))
    if part_id:
        query = query.filter(models.StockMovement.part_id == part_id)
    return query.all()

def create_movement(db: Session, movement: schemas.StockMovementCreate):
    """
    Cria um novo movimento de estoque no banco de dados.
    Args:
        db (Session): Sessão do banco de dados.
        movement (schemas.StockMovementCreate): Dados do movimento de estoque para criação.
    Returns:
        models.StockMovement: O objeto movimento de estoque recém-criado.
    """
    db_movement = models.StockMovement(**movement.model_dump())
    db.add(db_movement)
    db.commit()
    db.refresh(db_movement)
    return db_movement

# --- CONFIG CRUD ---
# Funções para operações CRUD relacionadas a configurações (fabricantes, modelos, informações da empresa).

def get_manufacturers(db: Session, type: Optional[str] = None):
    """
    Retorna uma lista de fabricantes, opcionalmente filtrada por tipo (BOAT ou ENGINE).
    Carrega os modelos relacionados para evitar N+1 queries.
    Args:
        db (Session): Sessão do banco de dados.
        type (Optional[str]): Tipo do fabricante para filtrar.
    Returns:
        List[models.Manufacturer]: Lista de objetos fabricante.
    """
    query = db.query(models.Manufacturer).options(joinedload(models.Manufacturer.models))
    if type:
        query = query.filter(models.Manufacturer.type == type)
    return query.all()

def create_manufacturer(db: Session, manufacturer: schemas.ManufacturerCreate):
    """
    Cria um novo fabricante no banco de dados.
    Args:
        db (Session): Sessão do banco de dados.
        manufacturer (schemas.ManufacturerCreate): Dados do fabricante para criação.
    Returns:
        models.Manufacturer: O objeto fabricante recém-criado.
    """
    db_manufacturer = models.Manufacturer(name=manufacturer.name, type=manufacturer.type)
    db.add(db_manufacturer)
    db.commit()
    db.refresh(db_manufacturer)
    return db_manufacturer

def delete_manufacturer(db: Session, manufacturer_id: int):
    """
    Deleta um fabricante pelo ID.
    Args:
        db (Session): Sessão do banco de dados.
        manufacturer_id (int): ID do fabricante a ser deletado.
    Returns:
        models.Manufacturer: O objeto fabricante deletado, ou None se não encontrado.
    """
    db_manufacturer = db.query(models.Manufacturer).filter(models.Manufacturer.id == manufacturer_id).first()
    if db_manufacturer:
        db.delete(db_manufacturer)
        db.commit()
    return db_manufacturer

def create_model(db: Session, manufacturer_id: int, model: schemas.ModelCreate):
    """
    Cria um novo modelo associado a um fabricante.
    Args:
        db (Session): Sessão do banco de dados.
        manufacturer_id (int): ID do fabricante ao qual o modelo será associado.
        model (schemas.ModelCreate): Dados do modelo para criação.
    Returns:
        models.Model: O objeto modelo recém-criado.
    """
    db_model = models.Model(name=model.name, manufacturer_id=manufacturer_id)
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    return db_model

def delete_model(db: Session, model_id: int):
    """
    Deleta um modelo pelo ID.
    Args:
        db (Session): Sessão do banco de dados.
        model_id (int): ID do modelo a ser deletado.
    Returns:
        models.Model: O objeto modelo deletado, ou None se não encontrado.
    """
    db_model = db.query(models.Model).filter(models.Model.id == model_id).first()
    if db_model:
        db.delete(db_model)
        db.commit()
    return db_model

def get_company_info(db: Session):
    """
    Retorna as informações da empresa. Como geralmente há apenas uma entrada,
    ela retorna a primeira encontrada.
    Args:
        db (Session): Sessão do banco de dados.
    Returns:
        models.CompanyInfo: O objeto com as informações da empresa, ou None.
    """
    return db.query(models.CompanyInfo).first()

def update_company_info(db: Session, info: schemas.CompanyInfoCreate):
    """
    Atualiza as informações da empresa. Se não existirem informações, uma nova entrada é criada.
    Args:
        db (Session): Sessão do banco de dados.
        info (schemas.CompanyInfoCreate): Dados para atualização das informações da empresa.
    Returns:
        models.CompanyInfo: O objeto com as informações da empresa atualizado.
    """
    db_info = db.query(models.CompanyInfo).first()
    if not db_info:
        # Se não houver informações da empresa, cria uma nova.
        db_info = models.CompanyInfo()
        db.add(db_info)

    # Atualiza os atributos do objeto do banco de dados com os dados do schema.
    update_data = info.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(db_info, key, value)
            
    db.commit()
    db.refresh(db_info)
    return db_info

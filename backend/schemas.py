"""
Este arquivo define os esquemas (schemas) de dados usando Pydantic.
Esses esquemas são usados para validação de entrada de dados (requisições) e
serialização de saída de dados (respostas) para a API. Eles garantem que
os dados enviados e recebidos pela API estejam em um formato consistente e válido.
"""

from pydantic import BaseModel, EmailStr, ConfigDict
from pydantic.alias_generators import to_camel
from typing import Optional, List
from datetime import datetime
# Importa os enums definidos nos modelos para uso nos schemas.
from models import UserRole, OSStatus, ItemType, MovementType # Adicionado MovementType

# Configuração base para converter snake_case (Python) para camelCase (JavaScript/JSON)
# e permitir a criação de modelos a partir de instâncias ORM (from_attributes).
class CamelModel(BaseModel):
    """
    Classe base para todos os schemas Pydantic, configurando:
    - `alias_generator=to_camel`: Converte automaticamente nomes de campos de snake_case (Python)
      para camelCase (JSON), o padrão em muitas APIs e frontends JavaScript.
    - `populate_by_name=True`: Permite que os campos sejam preenchidos tanto pelo nome original (snake_case)
      quanto pelo alias (camelCase).
    - `from_attributes=True`: Permite que os modelos Pydantic sejam criados a partir de
      instâncias de objetos ORM (como os modelos SQLAlchemy).
    """
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True
    )

# --- USER SCHEMAS ---
# Esquemas para validação e serialização de dados relacionados a usuários.

class UserBase(CamelModel):
    """
    Schema base para um usuário, contendo os campos comuns.
    """
    email: EmailStr # Endereço de email, validado como um formato de email.
    name: str # Nome do usuário.
    role: UserRole # Papel do usuário, usando o Enum UserRole.
    client_id: Optional[int] = None # ID do cliente associado, opcional.

class UserCreate(UserBase):
    """
    Schema para criação de um novo usuário.
    Inclui o campo 'password', que não é retornado na leitura.
    """
    password: str # Senha do usuário (texto puro, será hashed antes de salvar).

class User(UserBase):
    """
    Schema para representação completa de um usuário (para leitura/resposta da API).
    Inclui o 'id' gerado pelo banco de dados.
    """
    id: int # ID único do usuário.

class Token(CamelModel):
    """
    Schema para tokens de autenticação JWT.
    """
    access_token: str # O token de acesso.
    token_type: str # Tipo do token (ex: "bearer").

class TokenData(CamelModel):
    """
    Schema para os dados contidos dentro do token (payload).
    """
    email: Optional[str] = None # Email do usuário, opcionalmente incluído no token.

# --- CLIENT SCHEMAS ---
# Esquemas para validação e serialização de dados relacionados a clientes.

class ClientBase(CamelModel):
    """
    Schema base para um cliente.
    """
    name: str # Nome ou Razão Social do cliente.
    document: str # CPF ou CNPJ do cliente.
    phone: Optional[str] = None # Telefone de contato.
    email: Optional[str] = None # Email do cliente.
    address: Optional[str] = None # Endereço completo.
    type: Optional[str] = None  # Tipo de cliente: PARTICULAR, EMPRESA, GOVERNO.

class ClientCreate(ClientBase):
    """
    Schema para criação de um novo cliente. Atualmente, igual ao ClientBase.
    """
    pass

class Client(ClientBase):
    """
    Schema para representação completa de um cliente.
    """
    id: int # ID único do cliente.

# --- MARINA SCHEMAS ---
# Esquemas para validação e serialização de dados relacionados a marinas.

class MarinaBase(CamelModel):
    """
    Schema base para uma marina.
    """
    name: str # Nome da marina.
    address: Optional[str] = None # Endereço.
    contact_name: Optional[str] = None # Nome do contato.
    phone: Optional[str] = None # Telefone.
    coordinates: Optional[str] = None # Coordenadas geográficas.
    operating_hours: Optional[str] = None # Horário de funcionamento.

class MarinaCreate(MarinaBase):
    """
    Schema para criação de uma nova marina.
    """
    pass

class Marina(MarinaBase):
    """
    Schema para representação completa de uma marina.
    """
    id: int # ID único da marina.

# --- ENGINE SCHEMAS ---
# Esquemas para validação e serialização de dados relacionados a motores.

class EngineBase(CamelModel):
    """
    Schema base para um motor.
    """
    serial_number: str # Número de série do motor.
    motor_number: Optional[str] = None # Número do motor.
    model: str # Modelo do motor.
    sale_date: Optional[str] = None # Data de venda.
    warranty_status: Optional[str] = None # Status da garantia.
    warranty_validity: Optional[str] = None # Validade da garantia.
    client_name: Optional[str] = None # Nome do cliente.
    hours: int = 0 # Horas de uso.
    year: Optional[int] = None # Ano de fabricação.

class EngineCreate(EngineBase):
    """
    Schema para criação de um novo motor.
    """
    pass

class Engine(EngineBase):
    """
    Schema para representação completa de um motor.
    """
    id: int # ID único do motor.
    boat_id: int # ID da embarcação à qual pertence.

class EngineUpdate(CamelModel):
    """
    Schema para atualização de um motor. Todos os campos são opcionais.
    """
    id: Optional[int] = None # ID do motor a ser atualizado.
    serial_number: Optional[str] = None
    motor_number: Optional[str] = None
    model: Optional[str] = None
    sale_date: Optional[str] = None
    warranty_status: Optional[str] = None
    warranty_validity: Optional[str] = None
    client_name: Optional[str] = None
    hours: Optional[int] = None
    year: Optional[int] = None


# --- BOAT SCHEMAS ---
# Esquemas para validação e serialização de dados relacionados a embarcações.

class BoatBase(CamelModel):
    """
    Schema base para uma embarcação.
    """
    name: str # Nome da embarcação.
    hull_id: str # ID do casco.
    model: Optional[str] = None # Modelo da embarcação.
    usage_type: Optional[str] = None # Tipo de uso.
    client_id: int # ID do cliente proprietário.
    marina_id: Optional[int] = None # ID da marina.

class BoatCreate(BoatBase):
    """
    Schema para criação de uma nova embarcação.
    Inclui uma lista de motores para serem criados junto com a embarcação.
    """
    engines: List[EngineCreate] = [] # Lista de motores para a embarcação.

class BoatUpdate(CamelModel):
    """
    Schema para atualização de uma embarcação.
    Permite atualizar dados da embarcação e a lista de motores.
    """
    name: Optional[str] = None
    hull_id: Optional[str] = None
    model: Optional[str] = None
    usage_type: Optional[str] = None
    client_id: Optional[int] = None
    marina_id: Optional[int] = None
    engines: List[EngineUpdate] = [] # Lista de motores a serem atualizados.

class Boat(BoatBase):
    """
    Schema para representação completa de uma embarcação.
    """
    id: int # ID único da embarcação.
    engines: List[Engine] = [] # Lista completa de motores associados.

# --- PART SCHEMAS ---
# Esquemas para validação e serialização de dados relacionados a peças.

class PartBase(CamelModel):
    """
    Schema base para uma peça.
    """
    sku: str # SKU da peça.
    name: str # Nome da peça.
    barcode: Optional[str] = None # Código de barras.
    quantity: float = 0 # Quantidade em estoque.
    cost: float = 0 # Custo da peça.
    price: float = 0 # Preço de venda.
    min_stock: float = 0 # Estoque mínimo.
    location: Optional[str] = None # Localização no estoque.

class PartCreate(PartBase):
    """
    Schema para criação de uma nova peça.
    """
    pass

class PartUpdate(CamelModel):
    """
    Schema para atualização de uma peça. Todos os campos são opcionais.
    """
    name: Optional[str] = None
    quantity: Optional[float] = None
    cost: Optional[float] = None
    price: Optional[float] = None
    min_stock: Optional[float] = None
    location: Optional[str] = None

class Part(PartBase):
    """
    Schema para representação completa de uma peça.
    """
    id: int # ID único da peça.

# --- SERVICE ITEM SCHEMAS ---
# Esquemas para validação e serialização de dados relacionados a itens de serviço.

class ServiceItemBase(CamelModel):
    """
    Schema base para um item de serviço (peça ou mão de obra).
    """
    type: ItemType # Tipo do item (PART ou LABOR).
    description: str # Descrição do item.
    part_id: Optional[int] = None # ID da peça (se for uma peça).
    quantity: float = 1 # Quantidade utilizada.
    unit_cost: float = 0 # Custo unitário.
    unit_price: float # Preço de venda unitário.
    total: float # Valor total (quantidade * preço unitário).

class ServiceItemCreate(ServiceItemBase):
    """
    Schema para criação de um novo item de serviço.
    """
    pass

class ServiceItem(ServiceItemBase):
    """
    Schema para representação completa de um item de serviço.
    """
    id: int # ID único do item.
    order_id: int # ID da Ordem de Serviço à qual pertence.

# --- ORDER NOTE SCHEMAS ---
# Esquemas para validação e serialização de dados relacionados a notas de ordem de serviço.

class OrderNoteBase(CamelModel):
    """
    Schema base para uma nota de ordem de serviço.
    """
    text: str # Conteúdo da nota.
    user_name: Optional[str] = None # Nome do usuário que adicionou a nota.

class OrderNoteCreate(OrderNoteBase):
    """
    Schema para criação de uma nova nota de ordem de serviço.
    """
    pass

class OrderNote(OrderNoteBase):
    """
    Schema para representação completa de uma nota de ordem de serviço.
    """
    id: int # ID único da nota.
    order_id: int # ID da Ordem de Serviço.
    created_at: datetime # Data e hora de criação.

# --- SERVICE ORDER SCHEMAS ---
# Esquemas para validação e serialização de dados relacionados a ordens de serviço.

class ServiceOrderBase(CamelModel):
    """
    Schema base para uma ordem de serviço.
    """
    boat_id: int # ID da embarcação.
    engine_id: Optional[int] = None # ID do motor.
    description: str # Descrição do serviço.
    diagnosis: Optional[str] = None # Diagnóstico.
    status: OSStatus = OSStatus.PENDING # Status da OS.
    requester: Optional[str] = None # Solicitante.
    technician_name: Optional[str] = None # Técnico responsável.
    scheduled_at: Optional[datetime] = None # Data agendada.
    estimated_duration: Optional[int] = None # Duração estimada em horas.

class ServiceOrderCreate(ServiceOrderBase):
    """
    Schema para criação de uma nova ordem de serviço.
    """
    pass

class ServiceOrderUpdate(CamelModel):
    """
    Schema para atualização de uma ordem de serviço.
    """
    description: Optional[str] = None
    diagnosis: Optional[str] = None
    status: Optional[OSStatus] = None
    technician_name: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    estimated_duration: Optional[int] = None

class ServiceOrder(ServiceOrderBase):
    """
    Schema para representação completa de uma ordem de serviço.
    """
    id: int # ID único da OS.
    total_value: float # Valor total da OS.
    created_at: datetime # Data de criação.
    items: List[ServiceItem] = [] # Lista de itens de serviço.
    notes: List[OrderNote] = [] # Lista de notas.

# --- TRANSACTION SCHEMAS ---
# Esquemas para validação e serialização de dados relacionados a transações financeiras.

class TransactionBase(CamelModel):
    """
    Schema base para uma transação financeira.
    """
    type: str  # Tipo de transação: INCOME (receita) ou EXPENSE (despesa).
    category: str # Categoria da transação.
    description: str # Descrição.
    amount: float # Valor.
    date: datetime # Data da transação.
    status: str = "PENDING"  # Status: PAID, PENDING, CANCELED.
    order_id: Optional[int] = None # ID da OS relacionada (opcional).
    document_number: Optional[str] = None # Número do documento.

class TransactionCreate(TransactionBase):
    """
    Schema para criação de uma nova transação.
    """
    pass

class Transaction(TransactionBase):
    """
    Schema para representação completa de uma transação.
    """
    id: int # ID único da transação.

# --- STOCK MOVEMENT SCHEMAS ---
# Esquemas para validação e serialização de dados relacionados a movimentos de estoque.

class StockMovementBase(CamelModel):
    """
    Schema base para um movimento de estoque.
    """
    part_id: int # ID da peça movimentada.
    type: MovementType # Tipo de movimento (entrada, saída, ajuste), usando o Enum MovementType.
    quantity: float # Quantidade movimentada.
    description: str # Descrição do movimento.
    reference_id: Optional[str] = None # Referência (ex: NFe, OS).
    user: Optional[str] = None # Usuário responsável.

class StockMovementCreate(StockMovementBase):
    """
    Schema para criação de um novo movimento de estoque.
    """
    pass

class StockMovement(StockMovementBase):
    """
    Schema para representação completa de um movimento de estoque.
    """
    id: int # ID único do movimento.
    date: datetime # Data e hora do movimento.

# --- CONFIG SCHEMAS ---
# Esquemas para validação e serialização de dados relacionados à configuração da aplicação.

class ModelBase(CamelModel):
    """
    Schema base para um modelo de embarcação ou motor.
    """
    name: str # Nome do modelo.

class ModelCreate(ModelBase):
    """
    Schema para criação de um novo modelo.
    """
    pass

class Model(ModelBase):
    """
    Schema para representação completa de um modelo.
    """
    id: int # ID único do modelo.
    manufacturer_id: int # ID do fabricante associado.

class ManufacturerBase(CamelModel):
    """
    Schema base para um fabricante.
    """
    name: str # Nome do fabricante.
    type: str # Tipo do fabricante: "BOAT" ou "ENGINE".

class ManufacturerCreate(ManufacturerBase):
    """
    Schema para criação de um novo fabricante.
    """
    pass

class Manufacturer(ManufacturerBase):
    """
    Schema para representação completa de um fabricante.
    """
    id: int # ID único do fabricante.
    models: List[Model] = [] # Lista de modelos associados a este fabricante.

class CompanyInfoBase(CamelModel):
    """
    Schema base para informações da empresa.
    """
    company_name: Optional[str] = None # Razão social.
    trade_name: Optional[str] = None # Nome fantasia.
    cnpj: Optional[str] = None # CNPJ.
    ie: Optional[str] = None # Inscrição Estadual.
    street: Optional[str] = None # Rua.
    number: Optional[str] = None # Número.
    neighborhood: Optional[str] = None # Bairro.
    city: Optional[str] = None # Cidade.
    state: Optional[str] = None # Estado.
    zip_code: Optional[str] = None # CEP. # Alterado de 'zip' para 'zip_code' para consistência.
    crt: Optional[str] = None # Código de Regime Tributário.
    environment: Optional[str] = None # Ambiente (production ou homologation)
    mercury_username: Optional[str] = None
    mercury_password: Optional[str] = None

class CompanyInfoCreate(CompanyInfoBase):
    """
    Schema para criação de informações da empresa.
    """
    pass

class CompanyInfo(CompanyInfoBase):
    """
    Schema para representação completa das informações da empresa.
    """
    id: int # ID único.


"""
Este arquivo define os modelos de banco de dados usando SQLAlchemy.
Cada classe representa uma tabela no banco de dados e seus atributos correspondem às colunas da tabela.
"""

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean, Enum
from sqlalchemy.orm import relationship
from database import Base # Importa a classe Base do SQLAlchemy declarada em database.py
from datetime import datetime
import enum # Usado para definir enums Python que serão mapeados para o banco de dados

# --- ENUMS ---
# Definições de enumeradores para padronizar valores em certas colunas do banco de dados.

class UserRole(str, enum.Enum):
    """
    Enum para os diferentes papéis que um usuário pode ter na aplicação.
    ADMIN: Acesso total.
    TECHNICIAN: Técnico, acesso a ordens de serviço e inventário.
    CLIENT: Cliente, acesso limitado às suas próprias informações e embarcações.
    """
    ADMIN = "ADMIN"
    TECHNICIAN = "TECHNICIAN"
    CLIENT = "CLIENT"

class OSStatus(str, enum.Enum):
    """
    Enum para os possíveis status de uma Ordem de Serviço (OS).
    """
    PENDING = "Pendente"
    QUOTATION = "Em Orçamento"
    APPROVED = "Aprovado"
    IN_PROGRESS = "Em Execução"
    COMPLETED = "Concluído"
    CANCELED = "Cancelado"

class ItemType(str, enum.Enum):
    """
    Enum para os tipos de itens que podem ser adicionados a uma Ordem de Serviço.
    PART: Peça.
    LABOR: Mão de obra.
    """
    PART = "PART"
    LABOR = "LABOR"

class MovementType(str, enum.Enum):
    """
    Enum para os tipos de movimentos que podem ocorrer no estoque de peças.
    IN_INVOICE: Entrada por nota fiscal.
    OUT_OS: Saída por ordem de serviço.
    ADJUSTMENT_PLUS: Ajuste positivo (adição).
    ADJUSTMENT_MINUS: Ajuste negativo (remoção).
    RETURN_OS: Retorno de peça de OS.
    """
    IN_INVOICE = "IN_INVOICE"
    OUT_OS = "OUT_OS"
    ADJUSTMENT_PLUS = "ADJUSTMENT_PLUS"
    ADJUSTMENT_MINUS = "ADJUSTMENT_MINUS"
    RETURN_OS = "RETURN_OS"

# --- MODELS ---
# Cada classe abaixo representa uma tabela no banco de dados.

class Tenant(Base):
    """
    Modelo para a tabela 'tenants'. Suporte Multi-Tenancy (múltiplas empresas no mesmo sistema).
    Cada tenant representa uma empresa/marina diferente com seus próprios dados isolados.
    """
    __tablename__ = "tenants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False) # Nome da empresa/marina
    cnpj = Column(String(50)) # CNPJ da empresa
    subdomain = Column(String(100), unique=True) # Subdomínio único (ex: marealta.app.com)
    is_active = Column(Boolean, default=True) # Se o tenant está ativo
    created_at = Column(DateTime, default=datetime.utcnow)

class User(Base):
    """
    Modelo para a tabela 'users'. Armazena informações dos usuários do sistema.
    """
    __tablename__ = "users" # Nome da tabela no banco de dados
    
    id = Column(Integer, primary_key=True, index=True) # Chave primária auto-incrementável
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True) # ID do tenant (empresa)
    name = Column(String(200), nullable=False) # Nome completo do usuário
    email = Column(String(200), index=True, nullable=False) # Email do usuário (único por tenant)
    hashed_password = Column(String(200), nullable=False) # Senha do usuário (hash)
    role = Column(Enum(UserRole), nullable=False) # Papel do usuário (ADMIN, TECHNICIAN, CLIENT)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=True) # ID do cliente associado, se for um usuário cliente
    
    # Relacionamento com a tabela Client. Um usuário pode estar associado a um cliente.
    client = relationship("Client", back_populates="user")

class Client(Base):
    """
    Modelo para a tabela 'clients'. Armazena informações dos clientes da empresa.
    """
    __tablename__ = "clients"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True) # ID do tenant
    name = Column(String(200), nullable=False) # Nome ou Razão Social do cliente
    document = Column(String(50), nullable=False) # CPF ou CNPJ do cliente
    phone = Column(String(50)) # Telefone de contato
    email = Column(String(200)) # Email do cliente
    address = Column(Text) # Endereço completo
    type = Column(String(50))  # Tipo de cliente: PARTICULAR, EMPRESA, GOVERNO
    
    # Relacionamento com a tabela Boat. Um cliente pode ter múltiplas embarcações.
    boats = relationship("Boat", back_populates="owner")
    # Relacionamento com a tabela User. Um cliente pode ter um usuário associado.
    user = relationship("User", back_populates="client", uselist=False) # uselist=False indica relacionamento um-para-um ou um-para-zero

class Marina(Base):
    """
    Modelo para a tabela 'marinas'. Armazena informações sobre as marinas.
    """
    __tablename__ = "marinas"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True) # ID do tenant
    name = Column(String(200), nullable=False) # Nome da marina
    address = Column(Text) # Endereço da marina
    contact_name = Column(String(200)) # Nome da pessoa de contato na marina
    phone = Column(String(50)) # Telefone da marina
    coordinates = Column(String(100)) # Coordenadas geográficas (ex: latitude, longitude)
    operating_hours = Column(String(200)) # Horário de funcionamento
    
    # Relacionamento com a tabela Boat. Uma marina pode abrigar múltiplas embarcações.
    boats = relationship("Boat", back_populates="marina")

class Engine(Base):
    """
    Modelo para a tabela 'engines'. Armazena informações detalhadas sobre os motores das embarcações.
    """
    __tablename__ = "engines"

    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True) # ID do tenant
    boat_id = Column(Integer, ForeignKey("boats.id"), nullable=False) # ID da embarcação à qual o motor pertence
    serial_number = Column(String(100), nullable=False) # Número de série do motor
    motor_number = Column(String(100)) # Número do motor (geralmente diferente do serial)
    model = Column(String(200), nullable=False) # Modelo do motor
    sale_date = Column(String(50)) # Data de venda do motor
    warranty_status = Column(String(100)) # Status da garantia (ex: Ativa, Expirada)
    warranty_validity = Column(String(50)) # Validade da garantia
    client_name = Column(String(200)) # Nome do cliente proprietário do motor (pode ser redundante se client_id já existe na Boat)
    hours = Column(Integer, default=0) # Horas de uso do motor
    year = Column(Integer) # Ano de fabricação do motor

    # Relacionamento com a tabela Boat. Um motor pertence a uma embarcação.
    boat = relationship("Boat", back_populates="engines")

class Boat(Base):
    """
    Modelo para a tabela 'boats'. Armazena informações sobre as embarcações.
    """
    __tablename__ = "boats"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True) # ID do tenant
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False) # ID do cliente proprietário da embarcação
    marina_id = Column(Integer, ForeignKey("marinas.id"), nullable=True) # ID da marina onde a embarcação está (opcional)
    name = Column(String(200), nullable=False) # Nome da embarcação
    hull_id = Column(String(100), nullable=False) # Número de identificação do casco (HIN)
    usage_type = Column(String(50))  # Tipo de uso: LAZER, PESCA, COMERCIAL, GOVERNO
    model = Column(String(200)) # Modelo da embarcação
    
    # Relacionamento com Client. O proprietário da embarcação.
    owner = relationship("Client", back_populates="boats")
    # Relacionamento com Marina. A marina onde a embarcação está.
    marina = relationship("Marina", back_populates="boats")
    # Relacionamento com Engine. Uma embarcação pode ter múltiplos motores.
    engines = relationship("Engine", back_populates="boat", cascade="all, delete-orphan") # 'cascade' remove motores se a embarcação for excluída
    # Relacionamento com ServiceOrder. Uma embarcação pode ter múltiplas ordens de serviço.
    service_orders = relationship("ServiceOrder", back_populates="boat")

class Part(Base):
    """
    Modelo para a tabela 'parts'. Armazena informações sobre peças de estoque.
    """
    __tablename__ = "parts"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True) # ID do tenant
    sku = Column(String(100), index=True, nullable=False) # SKU (único por tenant)
    barcode = Column(String(100), nullable=True) # Código de barras da peça (opcional)
    name = Column(String(200), nullable=False) # Nome/descrição da peça
    quantity = Column(Float, default=0) # Quantidade atual em estoque
    cost = Column(Float, default=0) # Custo unitário da peça
    price = Column(Float, default=0) # Preço de venda unitário da peça
    min_stock = Column(Float, default=0) # Estoque mínimo para alerta
    location = Column(String(100)) # Localização física da peça no estoque
    
    # Relacionamento com StockMovement. Uma peça pode ter múltiplos movimentos de estoque.
    movements = relationship("StockMovement", back_populates="part")
    # Relacionamento com ServiceItem. Uma peça pode ser usada em múltiplos itens de serviço.
    service_items = relationship("ServiceItem", back_populates="part")

class ServiceOrder(Base):
    """
    Modelo para a tabela 'service_orders'. Armazena informações sobre as ordens de serviço.
    """
    __tablename__ = "service_orders"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True) # ID do tenant
    boat_id = Column(Integer, ForeignKey("boats.id"), nullable=False) # Embarcação relacionada à OS
    engine_id = Column(Integer, ForeignKey("engines.id"), nullable=True) # Motor relacionado à OS (opcional)
    description = Column(Text, nullable=False) # Descrição do serviço solicitado
    diagnosis = Column(Text) # Diagnóstico realizado
    status = Column(Enum(OSStatus), default=OSStatus.PENDING) # Status atual da OS
    total_value = Column(Float, default=0) # Valor total da OS
    created_at = Column(DateTime, default=datetime.utcnow) # Data e hora de criação da OS
    requester = Column(String(200)) # Nome do solicitante do serviço
    technician_name = Column(String(200)) # Nome do técnico responsável
    scheduled_at = Column(DateTime, nullable=True) # Data e hora agendada para o serviço
    estimated_duration = Column(Integer, nullable=True)  # Duração estimada em horas
    
    # Relacionamento com Boat. A embarcação desta OS.
    boat = relationship("Boat", back_populates="service_orders")
    # Relacionamento com ServiceItem. Itens (peças/mão de obra) desta OS.
    items = relationship("ServiceItem", back_populates="order", cascade="all, delete-orphan")
    # Relacionamento com OrderNote. Notas/observações adicionadas a esta OS.
    notes = relationship("OrderNote", back_populates="order", cascade="all, delete-orphan")

class ServiceItem(Base):
    """
    Modelo para a tabela 'service_items'. Detalha os itens (peças ou serviços) de uma Ordem de Serviço.
    """
    __tablename__ = "service_items"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("service_orders.id"), nullable=False) # ID da OS à qual o item pertence
    type = Column(Enum(ItemType), nullable=False) # Tipo do item (PART ou LABOR)
    description = Column(String(200), nullable=False) # Descrição do item
    part_id = Column(Integer, ForeignKey("parts.id"), nullable=True) # ID da peça associada (se type for PART)
    quantity = Column(Float, default=1) # Quantidade utilizada
    unit_cost = Column(Float, default=0) # Custo unitário (para controle interno)
    unit_price = Column(Float, nullable=False) # Preço de venda unitário
    total = Column(Float, nullable=False) # Valor total do item (quantidade * preço unitário)
    
    # Relacionamento com ServiceOrder. A OS deste item.
    order = relationship("ServiceOrder", back_populates="items")
    # Relacionamento com Part. A peça específica (se for uma peça).
    part = relationship("Part", back_populates="service_items")

class OrderNote(Base):
    """
    Modelo para a tabela 'order_notes'. Armazena notas e observações para Ordens de Serviço.
    """
    __tablename__ = "order_notes"
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("service_orders.id"), nullable=False) # ID da OS à qual a nota pertence
    text = Column(Text, nullable=False) # Conteúdo da nota
    created_at = Column(DateTime, default=datetime.utcnow) # Data e hora de criação da nota
    user_name = Column(String(200)) # Nome do usuário que adicionou a nota
    
    # Relacionamento com ServiceOrder. A OS desta nota.
    order = relationship("ServiceOrder", back_populates="notes")

class Invoice(Base):
    """
    Modelo para a tabela 'invoices'. Armazena informações sobre notas fiscais de entrada.
    """
    __tablename__ = "invoices"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True) # ID do tenant
    number = Column(String(100), nullable=False) # Número da nota fiscal (único por tenant)
    supplier = Column(String(200), nullable=False) # Fornecedor da nota
    date = Column(DateTime, nullable=False) # Data da emissão da nota
    total_value = Column(Float, default=0) # Valor total da nota
    xml_key = Column(String(200), nullable=True) # Chave de acesso do XML da nota fiscal (opcional)
    imported_at = Column(DateTime, default=datetime.utcnow) # Data e hora de importação da nota para o sistema

class StockMovement(Base):
    """
    Modelo para a tabela 'stock_movements'. Registra todos os movimentos de estoque de peças.
    """
    __tablename__ = "stock_movements"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True) # ID do tenant
    part_id = Column(Integer, ForeignKey("parts.id"), nullable=False) # ID da peça movimentada
    type = Column(Enum(MovementType), nullable=False) # Tipo de movimento (entrada, saída, ajuste)
    quantity = Column(Float, nullable=False) # Quantidade movimentada
    date = Column(DateTime, default=datetime.utcnow) # Data e hora do movimento
    reference_id = Column(String(100)) # Referência do movimento (ex: ID da OS, número da NFe)
    description = Column(String(200), nullable=False) # Descrição do movimento
    user = Column(String(200)) # Usuário responsável pelo movimento
    
    # Relacionamento com Part. A peça envolvida no movimento.
    part = relationship("Part", back_populates="movements")

class Transaction(Base):
    """
    Modelo para a tabela 'transactions'. Armazena transações financeiras (receitas e despesas).
    """
    __tablename__ = "transactions"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True) # ID do tenant
    type = Column(String(50), nullable=False)  # Tipo de transação: INCOME (receita) ou EXPENSE (despesa)
    category = Column(String(100), nullable=False) # Categoria da transação (ex: "Combustível", "Salário", "Serviço")
    description = Column(Text, nullable=False) # Descrição detalhada da transação
    amount = Column(Float, nullable=False) # Valor da transação
    date = Column(DateTime, nullable=False) # Data da transação
    status = Column(String(50), default="PENDING")  # Status da transação: PAID (pago), PENDING (pendente), CANCELED (cancelado)
    order_id = Column(Integer, nullable=True) # ID da Ordem de Serviço relacionada (opcional)
    document_number = Column(String(100)) # Número do documento fiscal ou de referência

class Manufacturer(Base):
    """
    Modelo para a tabela 'manufacturers'. Armazena informações sobre fabricantes de barcos/motores.
    """
    __tablename__ = "manufacturers"
    
    id = Column(Integer, primary_key=True, index=True)
    tenant_id = Column(Integer, ForeignKey("tenants.id"), nullable=False, index=True) # ID do tenant
    name = Column(String(200), nullable=False) # Nome do fabricante (único por tenant)
    type = Column(String(50), nullable=False) # Tipo de fabricante: BOAT (embarcação) ou ENGINE (motor)
    
    # Relacionamento com Model. Um fabricante pode ter múltiplos modelos.
    models = relationship("Model", back_populates="manufacturer", cascade="all, delete-orphan")

class Model(Base):
    """
    Modelo para a tabela 'models'. Armazena informações sobre modelos específicos de embarcações/motores.
    """
    __tablename__ = "models"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False) # Nome do modelo
    manufacturer_id = Column(Integer, ForeignKey("manufacturers.id"), nullable=False) # Fabricante ao qual o modelo pertence
    
    # Relacionamento com Manufacturer. O fabricante deste modelo.
    manufacturer = relationship("Manufacturer", back_populates="models")

class CompanyInfo(Base):
    """
    Modelo para a tabela 'company_info'. Armazena informações da própria empresa.
    """
    __tablename__ = "company_info"
    
    id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String(200)) # Razão social da empresa
    trade_name = Column(String(200)) # Nome fantasia da empresa
    cnpj = Column(String(50)) # CNPJ da empresa
    ie = Column(String(50)) # Inscrição Estadual da empresa
    
    # Informações de Endereço
    street = Column(String(200)) # Rua
    number = Column(String(50)) # Número
    neighborhood = Column(String(100)) # Bairro
    city = Column(String(100)) # Cidade
    state = Column(String(50)) # Estado
    zip_code = Column(String(20)) # CEP
    
    # Informações Fiscais
    crt = Column(String(10)) # Código de Regime Tributário
    environment = Column(String(20)) # Ambiente de operação (production ou homologation)

    # Integrações
    mercury_username = Column(String(100))
    mercury_password = Column(String(100))


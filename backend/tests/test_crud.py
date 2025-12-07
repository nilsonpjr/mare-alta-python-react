"""
Test CRUD operations - FIXED VERSION
"""
import pytest
from sqlalchemy.orm import Session
from models import User, Tenant, Client, Boat, Part, ServiceOrder


@pytest.mark.crud
class TestTenantCRUD:
    """Test tenant CRUD operations"""

    def test_create_tenant(self, db: Session):
        """Test creating a new tenant"""
        tenant = Tenant(
            name="Test Tenant 2",
            subdomain="test2",
            is_active=True
        )
        db.add(tenant)
        db.commit()
        db.refresh(tenant)
        
        assert tenant.id is not None
        assert tenant.name == "Test Tenant 2"


@pytest.mark.crud
class TestUserCRUD:
    """Test user CRUD operations"""

    def test_create_user(self, db: Session, test_tenant):
        """Test creating a new user"""
        from auth import get_password_hash
        
        user = User(
            name="New User",
            email="newuser@example.com",
            hashed_password=get_password_hash("password123"),
            role="TECHNICIAN",
            tenant_id=test_tenant.id
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        assert user.id is not None
        assert user.name == "New User"
        assert user.email == "newuser@example.com"
    
    def test_get_user_by_email(self, db: Session, test_user):
        """Test getting user by email"""
        user = db.query(User).filter(User.email == test_user.email).first()
        
        assert user is not None
        assert user.id == test_user.id


@pytest.mark.crud
class TestClientCRUD:
    """Test client CRUD operations"""

    def test_create_client(self, db: Session, test_tenant):
        """Test creating a new client"""
        client = Client(
            name="Test Client",
            document="12345678900",  # ✅ CORRIGIDO: usar 'document' não 'cpf_cnpj'
            email="client@example.com",
            phone="11999999999",
            address="Test Address",
            tenant_id=test_tenant.id
        )
        db.add(client)
        db.commit()
        db.refresh(client)
        
        assert client.id is not None
        assert client.name == "Test Client"
        assert client.document == "12345678900"
        assert client.tenant_id == test_tenant.id
    
    def test_get_clients(self, db: Session, test_tenant):
        """Test getting all clients"""
        # Create test clients
        for i in range(3):
            client = Client(
                name=f"Client {i}",
                document=f"1234567890{i}",  # ✅ CORRIGIDO
                email=f"client{i}@example.com",
                tenant_id=test_tenant.id
            )
            db.add(client)
        db.commit()
        
        clients = db.query(Client).filter(Client.tenant_id == test_tenant.id).all()
        
        assert len(clients) == 3
    
    def test_get_client_by_id(self, db: Session, test_tenant):
        """Test getting client by ID"""
        client = Client(
            name="Specific Client",
            document="12345678900",  # ✅ CORRIGIDO
            email="specific@example.com",
            tenant_id=test_tenant.id
        )
        db.add(client)
        db.commit()
        db.refresh(client)
        
        retrieved = db.query(Client).filter(Client.id == client.id).first()
        
        assert retrieved is not None
        assert retrieved.id == client.id
        assert retrieved.name == "Specific Client"


@pytest.mark.crud
class TestBoatCRUD:
    """Test boat CRUD operations"""

    def test_create_boat(self, db: Session, test_tenant):
        """Test creating a new boat"""
        # First create a client
        client = Client(
            name="Boat Owner",
            document="12345678900",  # ✅ CORRIGIDO
            email="owner@example.com",
            tenant_id=test_tenant.id
        )
        db.add(client)
        db.commit()
        db.refresh(client)
        
        # Create boat
        boat = Boat(
            model="Test Boat Model",
            year=2024,
            registration="ABC-1234",
            owner_id=client.id,
            tenant_id=test_tenant.id
        )
        db.add(boat)
        db.commit()
        db.refresh(boat)
        
        assert boat.id is not None
        assert boat.model == "Test Boat Model"
        assert boat.owner_id == client.id
    
    def test_get_boats(self, db: Session, test_tenant):
        """Test getting all boats"""
        # Create a client first
        client = Client(
            name="Boat Owner",
            document="12345678900",  # ✅ CORRIGIDO
            email="owner@example.com",
            tenant_id=test_tenant.id
        )
        db.add(client)
        db.commit()
        db.refresh(client)
        
        # Create boats
        for i in range(2):
            boat = Boat(
                model=f"Boat {i}",
                year=2024,
                owner_id=client.id,
                tenant_id=test_tenant.id
            )
            db.add(boat)
        db.commit()
        
        boats = db.query(Boat).filter(Boat.tenant_id == test_tenant.id).all()
        
        assert len(boats) == 2


@pytest.mark.crud
class TestPartCRUD:
    """Test parts inventory CRUD operations"""

    def test_create_part(self, db: Session, test_tenant):
        """Test creating a new part"""
        part = Part(
            sku="ABC-123",  # ✅ CORRIGIDO: usar 'sku' não 'part_number'
            name="Test Part",  # ✅ name é usado como descrição
            quantity=10.0,
            price=99.99,
            location="Shelf A1",
            tenant_id=test_tenant.id
        )
        db.add(part)
        db.commit()
        db.refresh(part)
        
        assert part.id is not None
        assert part.sku == "ABC-123"
        assert part.quantity == 10.0
    
    def test_get_parts(self, db: Session, test_tenant):
        """Test getting all parts"""
        for i in range(3):
            part = Part(
                sku=f"PART-{i}",  # ✅ CORRIGIDO
                name=f"Part {i}",
                quantity=5.0,
                price=10.0,
                tenant_id=test_tenant.id
            )
            db.add(part)
        db.commit()
        
        parts = db.query(Part).filter(Part.tenant_id == test_tenant.id).all()
        
        assert len(parts) == 3
    
    def test_update_part_quantity(self, db: Session, test_tenant):
        """Test updating part quantity"""
        part = Part(
            sku="TEST-PART",  # ✅ CORRIGIDO
            name="Test Part",
            quantity=10.0,
            price=50.0,
            tenant_id=test_tenant.id
        )
        db.add(part)
        db.commit()
        db.refresh(part)
        
        # Update quantity
        part.quantity = 20.0
        db.commit()
        db.refresh(part)
        
        assert part.quantity == 20.0


@pytest.mark.crud
class TestServiceOrderCRUD:
    """Test service order CRUD operations"""

    def test_create_service_order(self, db: Session, test_tenant):
        """Test creating a new service order"""
        # Create necessary dependencies
        client = Client(
            name="Test Client",
            document="12345678900",  # ✅ CORRIGIDO
            email="client@example.com",
            tenant_id=test_tenant.id
        )
        db.add(client)
        db.commit()
        db.refresh(client)
        
        boat = Boat(
            model="Test Boat",
            year=2024,
            owner_id=client.id,
            tenant_id=test_tenant.id
        )
        db.add(boat)
        db.commit()
        db.refresh(boat)
        
        order = ServiceOrder(
            boat_id=boat.id,
            description="Test service",
            status="Pendente",
            tenant_id=test_tenant.id
        )
        db.add(order)
        db.commit()
        db.refresh(order)
        
        assert order.id is not None
        assert order.boat_id == boat.id
        assert order.status == "Pendente"
    
    def test_get_service_orders(self, db: Session, test_tenant):
        """Test getting all service orders"""
        # Create dependencies
        client = Client(
            name="Test Client",
            document="12345678900",  # ✅ CORRIGIDO
            email="client@example.com",
            tenant_id=test_tenant.id
        )
        db.add(client)
        db.commit()
        db.refresh(client)
        
        boat = Boat(
            model="Test Boat",
            year=2024,
            owner_id=client.id,
            tenant_id=test_tenant.id
        )
        db.add(boat)
        db.commit()
        db.refresh(boat)
        
        # Create orders
        for i in range(2):
            order = ServiceOrder(
                boat_id=boat.id,
                description=f"Service {i}",
                status="Pendente",
                tenant_id=test_tenant.id
            )
            db.add(order)
        db.commit()
        
        orders = db.query(ServiceOrder).filter(ServiceOrder.tenant_id == test_tenant.id).all()
        
        assert len(orders) == 2

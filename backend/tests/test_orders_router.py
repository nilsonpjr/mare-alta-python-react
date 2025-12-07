"""
Test orders router - FIXED VERSION
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.routers
class TestOrdersRouter:
    """Test service orders router endpoints"""

    def test_get_orders(self, client: TestClient, auth_headers, test_tenant, db):
        """Test getting all service orders"""
        from models import Client, Boat, ServiceOrder
        
        # Create client and boat
        owner = Client(
            name="Owner",
            document="12345678900",  # ✅ CORRIGIDO
            email="owner@example.com",
            tenant_id=test_tenant.id
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)
        
        boat = Boat(
            model="Test Boat",
            year=2024,
            owner_id=owner.id,
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
        
        response = client.get("/api/orders", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
    
    def test_create_order(self, client: TestClient, auth_headers, test_tenant, db):
        """Test creating a new service order"""
        from models import Client, Boat
        
        owner = Client(
            name="Owner",
            document="12345678900",  # ✅ CORRIGIDO
            email="owner@example.com",
            tenant_id=test_tenant.id
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)
        
        boat = Boat(
            model="Test Boat",
            year=2024,
            owner_id=owner.id,
            tenant_id=test_tenant.id
        )
        db.add(boat)
        db.commit()
        db.refresh(boat)
        
        order_data = {
            "boat_id": boat.id,
            "description": "New service order",
            "status": "Pendente"
        }
        
        response = client.post(
            "/api/orders",
            json=order_data,
            headers=auth_headers
        )
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["description"] == "New service order"
    
    def test_get_order_by_id(self, client: TestClient, auth_headers, test_tenant, db):
        """Test getting a specific service order"""
        from models import Client, Boat, ServiceOrder
        
        owner = Client(
            name="Owner",
            document="12345678900",  # ✅ CORRIGIDO
            email="owner@example.com",
            tenant_id=test_tenant.id
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)
        
        boat = Boat(
            model="Test Boat",
            year=2024,
            owner_id=owner.id,
            tenant_id=test_tenant.id
        )
        db.add(boat)
        db.commit()
        db.refresh(boat)
        
        order = ServiceOrder(
            boat_id=boat.id,
            description="Specific order",
            status="Pendente",
            tenant_id=test_tenant.id
        )
        db.add(order)
        db.commit()
        db.refresh(order)
        
        response = client.get(f"/api/orders/{order.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["description"] == "Specific order"
    
    def test_update_order_status(self, client: TestClient, auth_headers, test_tenant, db):
        """Test updating service order status"""
        from models import Client, Boat, ServiceOrder
        
        owner = Client(
            name="Owner",
            document="12345678900",  # ✅ CORRIGIDO
            email="owner@example.com",
            tenant_id=test_tenant.id
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)
        
        boat = Boat(
            model="Test Boat",
            year=2024,
            owner_id=owner.id,
            tenant_id=test_tenant.id
        )
        db.add(boat)
        db.commit()
        db.refresh(boat)
        
        order = ServiceOrder(
            boat_id=boat.id,
            description="Test order",
            status="Pendente",
            tenant_id=test_tenant.id
        )
        db.add(order)
        db.commit()
        db.refresh(order)
        
        update_data = {
            "status": "Em Execução"
        }
        
        response = client.put(
            f"/api/orders/{order.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "Em Execução"
    
    def test_delete_order(self, client: TestClient, auth_headers, test_tenant, db):
        """Test deleting a service order"""
        from models import Client, Boat, ServiceOrder
        
        owner = Client(
            name="Owner",
            document="12345678900",  # ✅ CORRIGIDO
            email="owner@example.com",
            tenant_id=test_tenant.id
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)
        
        boat = Boat(
            model="Test Boat",
            year=2024,
            owner_id=owner.id,
            tenant_id=test_tenant.id
        )
        db.add(boat)
        db.commit()
        db.refresh(boat)
        
        order = ServiceOrder(
            boat_id=boat.id,
            description="To delete",
            status="Pendente",
            tenant_id=test_tenant.id
        )
        db.add(order)
        db.commit()
        db.refresh(order)
        
        response = client.delete(
            f"/api/orders/{order.id}",
            headers=auth_headers
        )
        
        assert response.status_code in [200, 204]
    
    def test_unauthorized_access(self, client: TestClient):
        """Test accessing orders without authentication"""
        response = client.get("/api/orders")
        
        assert response.status_code == 401

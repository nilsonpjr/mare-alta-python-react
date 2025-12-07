"""
Test inventory router - FIXED VERSION
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.routers
class TestInventoryRouter:
    """Test inventory router endpoints"""

    def test_get_parts(self, client: TestClient, auth_headers, test_tenant, db):
        """Test getting all parts"""
        from models import Part
        
        for i in range(3):
            part = Part(
                sku=f"PART-{i}",  # ✅ CORRIGIDO: usar 'sku'
                name=f"Part {i}",
                quantity=float(10 + i),
                price=float(50.0 + i),
                tenant_id=test_tenant.id
            )
            db.add(part)
        db.commit()
        
        response = client.get("/api/inventory/parts", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
    
    def test_create_part(self, client: TestClient, auth_headers):
        """Test creating a new part"""
        part_data = {
            "sku": "NEW-PART-001",  # ✅ CORRIGIDO
            "name": "New Part",
            "quantity": 25.0,
            "price": 99.99,
            "location": "Shelf A1"
        }
        
        response = client.post(
            "/api/inventory/parts",
            json=part_data,
            headers=auth_headers
        )
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["sku"] == "NEW-PART-001"  # ✅ CORRIGIDO
        assert data["quantity"] == 25.0
    
    def test_get_part_by_id(self, client: TestClient, auth_headers, test_tenant, db):
        """Test getting a specific part"""
        from models import Part
        
        part = Part(
            sku="SPECIFIC-PART",  # ✅ CORRIGIDO
            name="Specific Part",
            quantity=15.0,
            price=75.50,
            tenant_id=test_tenant.id
        )
        db.add(part)
        db.commit()
        db.refresh(part)
        
        response = client.get(f"/api/inventory/parts/{part.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["sku"] == "SPECIFIC-PART"  # ✅ CORRIGIDO
    
    def test_update_part(self, client: TestClient, auth_headers, test_tenant, db):
        """Test updating a part"""
        from models import Part
        
        part = Part(
            sku="UPDATE-PART",  # ✅ CORRIGIDO
            name="Original Name",
            quantity=10.0,
            price=50.0,
            tenant_id=test_tenant.id
        )
        db.add(part)
        db.commit()
        db.refresh(part)
        
        update_data = {
            "name": "Updated Name",
            "quantity": 20.0,
            "price": 75.0
        }
        
        response = client.put(
            f"/api/inventory/parts/{part.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["quantity"] == 20.0
    
    def test_update_part_quantity(self, client: TestClient, auth_headers, test_tenant, db):
        """Test updating part quantity specifically"""
        from models import Part
        
        part = Part(
            sku="QTY-PART",  # ✅ CORRIGIDO
            name="Quantity Test Part",
            quantity=10.0,
            price=50.0,
            tenant_id=test_tenant.id
        )
        db.add(part)
        db.commit()
        db.refresh(part)
        
        response = client.put(
            f"/api/inventory/parts/{part.id}",
            json={"quantity": 30.0},
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["quantity"] == 30.0
    
    def test_get_stock_movements(self, client: TestClient, auth_headers, test_tenant, db):
        """Test getting stock movements"""
        from models import Part, StockMovement
        
        part = Part(
            sku="STOCK-PART",  # ✅ CORRIGIDO
            name="Stock Part",
            quantity=100.0,
            price=50.0,
            tenant_id=test_tenant.id
        )
        db.add(part)
        db.commit()
        db.refresh(part)
        
        movement = StockMovement(
            part_id=part.id,
            quantity=10.0,
            type="IN_INVOICE", # ✅ CORRIGIDO de movement_type para type
            description="Stock replenishment",
            tenant_id=test_tenant.id
        )

        db.add(movement)
        db.commit()
        
        response = client.get("/api/inventory/movements", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 1
    
    def test_create_stock_movement(self, client: TestClient, auth_headers, test_tenant, db):
        """Test creating a stock movement"""
        from models import Part
        
        part = Part(
            sku="MOVE-PART",  # ✅ CORRIGIDO
            name="Movement Part",
            quantity=50.0,
            price=25.0,
            tenant_id=test_tenant.id
        )
        db.add(part)
        db.commit()
        db.refresh(part)
        
        movement_data = {
            "part_id": part.id,
            "quantity": 5.0,
            "type": "OUT_OS", # Correct field name
            "description": "Used in service"
        }
        
        response = client.post(
            "/api/inventory/movements",
            json=movement_data,
            headers=auth_headers
        )
        
        assert response.status_code in [200, 201]
    
    def test_unauthorized_access(self, client: TestClient):
        """Test accessing inventory without authentication"""
        response = client.get("/api/inventory/parts")
        
        assert response.status_code == 401

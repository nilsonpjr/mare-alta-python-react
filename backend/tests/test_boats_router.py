"""
Test boats router - FIXED VERSION
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.routers
class TestBoatsRouter:
    """Test boats router endpoints"""

    def test_get_boats(self, client: TestClient, auth_headers, test_tenant, db):
        """Test getting all boats"""
        from models import Client, Boat
        
        # Create a client first
        owner = Client(
            name="Boat Owner",
            document="12345678900",  # ✅ CORRIGIDO
            email="owner@example.com",
            tenant_id=test_tenant.id
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)
        
        # Create boats
        for i in range(2):
            boat = Boat(
                model=f"Boat Model {i}",
                year=2024,
                registration=f"ABC-123{i}",
                owner_id=owner.id,
                tenant_id=test_tenant.id
            )
            db.add(boat)
        db.commit()
        
        response = client.get("/api/boats", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2
    
    def test_create_boat(self, client: TestClient, auth_headers, test_tenant, db):
        """Test creating a new boat"""
        from models import Client
        
        # Create a client first
        owner = Client(
            name="Boat Owner",
            document="12345678900",  # ✅ CORRIGIDO
            email="owner@example.com",
            tenant_id=test_tenant.id
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)
        
        boat_data = {
            "model": "New Boat Model",
            "year": 2024,
            "registration": "XYZ-9999",
            "owner_id": owner.id
        }
        
        response = client.post(
            "/api/boats",
            json=boat_data,
            headers=auth_headers
        )
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["model"] == "New Boat Model"
    
    def test_get_boat_by_id(self, client: TestClient, auth_headers, test_tenant, db):
        """Test getting a specific boat"""
        from models import Client, Boat
        
        owner = Client(
            name="Boat Owner",
            document="12345678900",  # ✅ CORRIGIDO
            email="owner@example.com",
            tenant_id=test_tenant.id
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)
        
        boat = Boat(
            model="Specific Boat",
            year=2024,
            registration="SPEC-001",
            owner_id=owner.id,
            tenant_id=test_tenant.id
        )
        db.add(boat)
        db.commit()
        db.refresh(boat)
        
        response = client.get(f"/api/boats/{boat.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["model"] == "Specific Boat"
    
    def test_update_boat(self, client: TestClient, auth_headers, test_tenant, db):
        """Test updating a boat"""
        from models import Client, Boat
        
        owner = Client(
            name="Boat Owner",
            document="12345678900",  # ✅ CORRIGIDO
            email="owner@example.com",
            tenant_id=test_tenant.id
        )
        db.add(owner)
        db.commit()
        db.refresh(owner)
        
        boat = Boat(
            model="Original Model",
            year=2023,
            owner_id=owner.id,
            tenant_id=test_tenant.id
        )
        db.add(boat)
        db.commit()
        db.refresh(boat)
        
        update_data = {
            "model": "Updated Model",
            "year": 2024
        }
        
        response = client.put(
            f"/api/boats/{boat.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["model"] == "Updated Model"
    
    def test_unauthorized_access(self, client: TestClient):
        """Test accessing boats without authentication"""
        response = client.get("/api/boats")
        
        assert response.status_code == 401

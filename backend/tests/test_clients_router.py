"""
Test clients router - FIXED VERSION
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.routers
class TestClientsRouter:
    """Test clients router endpoints"""

    def test_get_clients(self, client: TestClient, auth_headers, test_tenant, db):
        """Test getting all clients"""
        from models import Client
        
        for i in range(3):
            test_client = Client(
                name=f"Client {i}",
                document=f"1234567890{i}",  # ✅ CORRIGIDO: usar 'document'
                email=f"client{i}@example.com",
                tenant_id=test_tenant.id
            )
            db.add(test_client)
        db.commit()
        
        response = client.get("/api/clients", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 3
    
    def test_create_client(self, client: TestClient, auth_headers):
        """Test creating a new client"""
        client_data = {
            "name": "New Client",
            "document": "98765432100",  # ✅ CORRIGIDO
            "email": "newclient@example.com",
            "phone": "11999999999",
            "address": "Test Address"
        }
        
        response = client.post(
            "/api/clients",
            json=client_data,
            headers=auth_headers
        )
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["name"] == "New Client"
        assert data["document"] == "98765432100"  # ✅ CORRIGIDO
    
    def test_get_client_by_id(self, client: TestClient, auth_headers, test_tenant, db):
        """Test getting a specific client"""
        from models import Client
        
        test_client = Client(
            name="Specific Client",
            document="12345678900",  # ✅ CORRIGIDO
            email="specific@example.com",
            tenant_id=test_tenant.id
        )
        db.add(test_client)
        db.commit()
        db.refresh(test_client)
        
        response = client.get(f"/api/clients/{test_client.id}", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Specific Client"
    
    def test_update_client(self, client: TestClient, auth_headers, test_tenant, db):
        """Test updating a client"""
        from models import Client
        
        test_client = Client(
            name="Original Name",
            document="12345678900",  # ✅ CORRIGIDO
            email="original@example.com",
            tenant_id=test_tenant.id
        )
        db.add(test_client)
        db.commit()
        db.refresh(test_client)
        
        update_data = {
            "name": "Updated Name",
            "email": "updated@example.com"
        }
        
        response = client.put(
            f"/api/clients/{test_client.id}",
            json=update_data,
            headers=auth_headers
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
    
    def test_delete_client(self, client: TestClient, auth_headers, test_tenant, db):
        """Test deleting a client"""
        from models import Client
        
        test_client = Client(
            name="To Delete",
            document="12345678900",  # ✅ CORRIGIDO
            email="delete@example.com",
            tenant_id=test_tenant.id
        )
        db.add(test_client)
        db.commit()
        db.refresh(test_client)
        
        response = client.delete(
            f"/api/clients/{test_client.id}",
            headers=auth_headers
        )
        
        assert response.status_code in [200, 204]
    
    def test_unauthorized_access(self, client: TestClient):
        """Test accessing clients without authentication"""
        response = client.get("/api/clients")
        
        assert response.status_code == 401

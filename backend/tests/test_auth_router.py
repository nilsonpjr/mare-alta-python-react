"""
Test authentication router - FIXED VERSION
"""
import pytest
from fastapi.testclient import TestClient


@pytest.mark.routers
@pytest.mark.auth
class TestAuthRouter:
    """Test authentication router endpoints"""

    def test_login_success(self, client: TestClient, test_user):
        """Test successful login"""
        response = client.post(
            "/api/auth/login",
            data={
                "username": test_user.email, # ✅ Username is email
                "password": "testpassword123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "accessToken" in data
        assert data["tokenType"] == "bearer"
    
    def test_login_wrong_password(self, client: TestClient, test_user):
        """Test login with wrong password"""
        response = client.post(
            "/api/auth/login",
            data={
                "username": test_user.email,
                "password": "wrongpassword"
            }
        )
        
        assert response.status_code == 401
    
    def test_login_wrong_username(self, client: TestClient, test_user):
        """Test login with non-existent username"""
        response = client.post(
            "/api/auth/login",
            data={
                "username": "nonexistent@example.com",
                "password": "testpassword123"
            }
        )
        
        assert response.status_code == 401
    
    def test_get_current_user(self, client: TestClient, auth_headers, test_user):
        """Test getting current user info"""
        response = client.get("/api/auth/me", headers=auth_headers)
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user.email
        assert data["name"] == test_user.name
    
    def test_get_current_user_unauthorized(self, client: TestClient):
        """Test getting current user without authentication"""
        response = client.get("/api/auth/me")
        
        assert response.status_code == 401
    
    def test_get_current_user_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token"""
        response = client.get(
            "/api/auth/me",
            headers={"Authorization": "Bearer invalid_token"}
        )
        
        assert response.status_code == 401
    
    def test_register_user(self, client: TestClient, test_tenant, db):
        """Test user registration"""
        from models import UserRole # Import Enum
        
        # Ensure tenant exists (created by fixture)
        
        response = client.post(
            "/api/auth/register",
            json={
                "email": "newuser@example.com",
                "name": "New User",
                "role": "CLIENT", # Pydantic converts string to Enum
                "password": "newpassword123"
            }
        )
        
        # Pode falhar se tenant_id for obrigatório e não inferido
        if response.status_code == 422:
             print(response.json())
        
        assert response.status_code in [200, 201]
        data = response.json()
        assert data["email"] == "newuser@example.com"
        
        # Cleanup
        # (Rollback is handled by db fixture usually, but good to be safe)

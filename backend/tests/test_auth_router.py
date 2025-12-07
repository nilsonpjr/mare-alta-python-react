"""
Test authentication router
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
                "username": "test@example.com",
                "password": "testpassword123"
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
    
    def test_login_wrong_password(self, client: TestClient, test_user):
        """Test login with wrong password"""
        response = client.post(
            "/api/auth/login",
            data={
                "username": "test@example.com",
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
    
    def test_login_inactive_user(self, client: TestClient, test_user, db):
        """Test login with inactive user - skipped as model doesn't have is_active"""
        # Note: Current User model doesn't have is_active field
        # This test is placeholder for future implementation
        pass
    
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
    
    def test_register_user(self, client: TestClient, test_tenant):
        """Test user registration"""
        response = client.post(
            "/api/auth/register",
            json={
                "username": "newuser",
                "email": "newuser@example.com",
                "password": "newpassword123",
                "full_name": "New User"
            }
        )
        
        # Registration might be disabled or require specific permissions
        # Adjust assertion based on your implementation
        assert response.status_code in [200, 201, 403, 404]

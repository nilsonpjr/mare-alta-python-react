"""
Test authentication module
"""
import pytest
from datetime import timedelta
import auth


@pytest.mark.auth
class TestPasswordHashing:
    """Test password hashing functions"""

    def test_password_hash_and_verify(self):
        """Test password hashing and verification"""
        password = "secure_password_123"
        hashed = auth.get_password_hash(password)
        
        assert hashed != password
        assert auth.verify_password(password, hashed)
    
    def test_wrong_password_verification(self):
        """Test that wrong password fails verification"""
        password = "secure_password_123"
        wrong_password = "wrong_password"
        hashed = auth.get_password_hash(password)
        
        assert not auth.verify_password(wrong_password, hashed)
    
    def test_different_hashes_for_same_password(self):
        """Test that same password produces different hashes (salt)"""
        password = "secure_password_123"
        hash1 = auth.get_password_hash(password)
        hash2 = auth.get_password_hash(password)
        
        assert hash1 != hash2
        assert auth.verify_password(password, hash1)
        assert auth.verify_password(password, hash2)


@pytest.mark.auth
class TestJWTTokens:
    """Test JWT token creation and verification"""

    def test_create_access_token(self):
        """Test creating an access token"""
        data = {"sub": "testuser", "tenant_id": 1}
        token = auth.create_access_token(data)
        
        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 0
    
    def test_create_access_token_with_expiry(self):
        """Test creating an access token with custom expiry"""
        data = {"sub": "testuser", "tenant_id": 1}
        expires_delta = timedelta(hours=1)
        token = auth.create_access_token(data, expires_delta=expires_delta)
        
        assert token is not None
        assert isinstance(token, str)
    
    def test_different_tokens_for_different_users(self):
        """Test that different users get different tokens"""
        data1 = {"sub": "user1", "tenant_id": 1}
        data2 = {"sub": "user2", "tenant_id": 1}
        
        token1 = auth.create_access_token(data1)
        token2 = auth.create_access_token(data2)
        
        assert token1 != token2


@pytest.mark.auth
class TestAuthUtilities:
    """Test authentication utility functions"""

    def test_password_hash_is_bcrypt(self):
        """Test that password hash uses bcrypt"""
        password = "test_password"
        hashed = auth.get_password_hash(password)
        
        # Bcrypt hashes start with $2b$
        assert hashed.startswith('$2b$')

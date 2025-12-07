"""
Pytest configuration and fixtures for backend tests
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient
from typing import Generator

from database import Base
from main import app
from dependencies import get_db, get_current_user
from models import User, Tenant
import auth


# Create in-memory SQLite database for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


@pytest.fixture(scope="function")
def db() -> Generator:
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db) -> Generator:
    """Create a test client with database dependency override"""
    def override_get_db():
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


@pytest.fixture
def test_tenant(db) -> Tenant:
    """Create a test tenant"""
    tenant = Tenant(
        name="Test Tenant",
        subdomain="test",
        is_active=True
    )
    db.add(tenant)
    db.commit()
    db.refresh(tenant)
    return tenant


@pytest.fixture
def test_user(db, test_tenant) -> User:
    """Create a test user"""
    hashed_password = auth.get_password_hash("testpassword123")
    user = User(
        name="Test User",
        email="test@example.com",
        hashed_password=hashed_password,
        role="ADMIN",
        tenant_id=test_tenant.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def test_admin_user(db, test_tenant) -> User:
    """Create a test admin user"""
    hashed_password = auth.get_password_hash("adminpassword123")
    user = User(
        name="Admin User",
        email="admin@example.com",
        hashed_password=hashed_password,
        role="ADMIN",
        tenant_id=test_tenant.id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def auth_token(test_user) -> str:
    """Create an authentication token for the test user"""
    access_token = auth.create_access_token(
        data={"sub": test_user.email, "tenant_id": test_user.tenant_id}
    )
    return access_token


@pytest.fixture
def admin_auth_token(test_admin_user) -> str:
    """Create an authentication token for the admin user"""
    access_token = auth.create_access_token(
        data={"sub": test_admin_user.email, "tenant_id": test_admin_user.tenant_id}
    )
    return access_token


@pytest.fixture
def auth_headers(auth_token) -> dict:
    """Create authorization headers with the test user token"""
    return {"Authorization": f"Bearer {auth_token}"}


@pytest.fixture
def admin_auth_headers(admin_auth_token) -> dict:
    """Create authorization headers with the admin user token"""
    return {"Authorization": f"Bearer {admin_auth_token}"}


@pytest.fixture(autouse=True)
def reset_dependency_overrides():
    """Reset dependency overrides after each test"""
    yield
    app.dependency_overrides.clear()

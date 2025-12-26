import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestAuthEndpoints:
    """Test authentication endpoints"""
    
    def test_login_missing_credentials(self):
        """Test login with missing credentials"""
        response = client.post("/api/auth/login", data={})
        assert response.status_code == 422  # Validation error
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        response = client.post(
            "/api/auth/login",
            data={
                "username": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code in [401, 404]  # Unauthorized or Not Found
    
    def test_protected_endpoint_without_token(self):
        """Test accessing protected endpoint without authentication"""
        response = client.get("/api/users/me")
        assert response.status_code == 401


class TestConfigEndpoints:
    """Test configuration endpoints"""
    
    def test_get_app_config_without_auth(self):
        """Test getting app config without authentication"""
        response = client.get("/api/config/app")
        assert response.status_code == 401
    
    def test_get_admin_config_without_auth(self):
        """Test getting admin config without authentication"""
        response = client.get("/api/config/admin")
        assert response.status_code == 401

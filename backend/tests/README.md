# Backend Tests

This directory contains tests for the CheckerQ backend API.

## Running Tests

```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_main.py

# Run with verbose output
pytest -v

# Run and show print statements
pytest -s
```

## Test Structure

- `test_main.py` - Tests for main application endpoints
- `test_api.py` - Tests for API endpoints (auth, config, etc.)
- Add more test files as needed following the `test_*.py` naming convention

## Writing Tests

Use pytest fixtures and FastAPI's TestClient:

```python
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_example():
    response = client.get("/api/endpoint")
    assert response.status_code == 200
```

## Test Database

For tests that require database access, consider using a separate test database or SQLite in-memory database.

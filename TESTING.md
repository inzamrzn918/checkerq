# Testing Guide - CheckerQ Project

This guide covers testing setup and best practices for all three components of the CheckerQ project.

---

## 📱 Mobile App Testing (Jest + React Native Testing Library)

### Setup Complete ✅
- **Framework**: Jest with jest-expo preset
- **Testing Library**: @testing-library/react-native
- **Configuration**: `jest.config.js` and `jest.setup.js`

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Files Location
- Place tests in `src/**/__tests__/*.test.ts(x)` or
- Co-locate with source files as `*.test.ts(x)`

### Example Test
```typescript
import { describe, it, expect } from '@jest/globals';

describe('MyComponent', () => {
  it('should render correctly', () => {
    // Your test here
  });
});
```

### Mocked Modules
- AsyncStorage
- expo-constants
- expo-secure-store
- React Native animations

---

## 🌐 Admin Portal Testing (Vitest + React Testing Library)

### Setup Complete ✅
- **Framework**: Vitest
- **Testing Library**: @testing-library/react
- **Configuration**: `vitest.config.ts` and `src/test/setup.ts`

### Running Tests

```bash
cd admin-portal

# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test Files Location
- Place tests in `src/test/*.test.ts(x)` or
- Co-locate with components as `*.test.ts(x)`

### Example Tests
See:
- `src/test/Dashboard.test.tsx` - Component testing
- `src/test/authService.test.ts` - Service testing

### Features
- Hot module reload for tests
- UI mode for interactive testing
- Coverage reports with v8

---

## 🔧 Backend Testing (pytest + FastAPI TestClient)

### Setup Complete ✅
- **Framework**: pytest (already in requirements.txt)
- **Test Client**: FastAPI TestClient
- **Configuration**: `pytest.ini`

### Running Tests

```bash
cd backend

# Run all tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html

# Run specific test file
pytest tests/test_main.py

# Run with verbose output
pytest -v
```

### Test Files Location
- All tests in `backend/tests/`
- Follow naming convention: `test_*.py`

### Example Tests
See:
- `tests/test_main.py` - Main endpoint tests
- `tests/test_api.py` - API endpoint tests

### Test Markers
```python
@pytest.mark.slow
@pytest.mark.integration
@pytest.mark.unit
```

---

## 🎯 Testing Best Practices

### General Guidelines

1. **Write Tests First** (TDD when possible)
2. **Keep Tests Simple** - One assertion per test when possible
3. **Use Descriptive Names** - Test names should describe what they test
4. **Mock External Dependencies** - APIs, databases, file systems
5. **Test Edge Cases** - Not just happy paths

### Coverage Goals

- **Minimum**: 60% code coverage
- **Target**: 80% code coverage
- **Critical Paths**: 100% coverage (auth, payments, data integrity)

### What to Test

✅ **Do Test**:
- Business logic
- API endpoints
- Data transformations
- Error handling
- Edge cases
- User interactions

❌ **Don't Test**:
- Third-party libraries
- Framework internals
- Simple getters/setters
- Configuration files

---

## 🚀 CI/CD Integration

### Recommended GitHub Actions Workflow

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test-mobile:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm test

  test-admin:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install --workspace=admin-portal
      - run: npm test --workspace=admin-portal

  test-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-python@v4
      - run: pip install -r requirements.txt
      - run: pytest
```

---

## 📊 Coverage Reports

### Mobile App
```bash
npm run test:coverage
# Report: coverage/index.html
```

### Admin Portal
```bash
cd admin-portal
npm run test:coverage
# Report: coverage/index.html
```

### Backend
```bash
cd backend
pytest --cov=app --cov-report=html
# Report: htmlcov/index.html
```

---

## 🔍 Debugging Tests

### Mobile App (Jest)
```bash
# Run specific test file
npm test -- src/services/__tests__/storage.test.ts

# Run tests matching pattern
npm test -- --testNamePattern="should save"

# Debug mode
node --inspect-brk node_modules/.bin/jest --runInBand
```

### Admin Portal (Vitest)
```bash
# Run specific test
npm test -- src/test/authService.test.ts

# Debug in UI mode
npm run test:ui
```

### Backend (pytest)
```bash
# Run specific test
pytest tests/test_main.py::test_root_endpoint

# Show print statements
pytest -s

# Drop into debugger on failure
pytest --pdb
```

---

## 📝 Writing Your First Test

### Mobile App Example
```typescript
// src/services/__tests__/myService.test.ts
import { describe, it, expect } from '@jest/globals';
import { myFunction } from '../myService';

describe('myService', () => {
  it('should return expected value', () => {
    const result = myFunction('input');
    expect(result).toBe('expected');
  });
});
```

### Admin Portal Example
```typescript
// admin-portal/src/test/MyComponent.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  it('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Backend Example
```python
# backend/tests/test_my_endpoint.py
import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_my_endpoint():
    response = client.get("/api/my-endpoint")
    assert response.status_code == 200
    assert response.json()["key"] == "value"
```

---

## 🛠️ Troubleshooting

### Common Issues

**Jest: Cannot find module**
- Ensure dependencies are installed: `npm install`
- Check import paths are correct
- Verify jest.config.js moduleNameMapper

**Vitest: Import errors**
- Check vite.config.ts resolve.alias
- Ensure TypeScript paths match

**Pytest: Import errors**
- Ensure you're in the backend directory
- Check PYTHONPATH includes app directory
- Verify __init__.py files exist

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Documentation](https://vitest.dev/)
- [pytest Documentation](https://docs.pytest.org/)
- [React Testing Library](https://testing-library.com/react)
- [FastAPI Testing](https://fastapi.tiangolo.com/tutorial/testing/)

---

## ✅ Next Steps

1. **Run the sample tests** to verify setup
2. **Write tests for critical paths** (auth, data operations)
3. **Set up CI/CD** to run tests automatically
4. **Aim for 80% coverage** on new code
5. **Review and update tests** as features evolve

---

*Last Updated: 2025-12-26*

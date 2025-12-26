# CheckerQ Admin Backend

A comprehensive admin portal backend for managing the CheckerQ exam evaluation system.

## Tech Stack

- **Framework**: FastAPI (Python 3.11+)
- **Database**: PostgreSQL
- **Cache**: Redis
- **Authentication**: JWT + Google OAuth
- **Task Queue**: Celery
- **API Docs**: Auto-generated Swagger/OpenAPI

## Setup

### Prerequisites

- Python 3.11+
- PostgreSQL 14+
- Redis 7+

### Installation

1. Create virtual environment:
```bash
python -m venv venv
venv\Scripts\activate  # Windows
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Run database migrations:
```bash
alembic upgrade head
```

5. Start the server:
```bash
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`
API documentation at `http://localhost:8000/docs`

## Project Structure

```
backend/
├── app/
│   ├── api/              # API endpoints
│   ├── core/             # Core configuration
│   ├── models/           # Database models
│   ├── schemas/          # Pydantic schemas
│   ├── services/         # Business logic
│   └── main.py           # Application entry point
├── alembic/              # Database migrations
├── tests/                # Test files
├── requirements.txt      # Python dependencies
└── .env.example          # Environment variables template
```

## API Endpoints

See `/docs` for complete API documentation.

## Development

Run tests:
```bash
pytest
```

Run with auto-reload:
```bash
uvicorn app.main:app --reload --port 8000
```

## License

Proprietary

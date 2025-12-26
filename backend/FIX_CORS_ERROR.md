# Fix for CORS_ORIGINS Error

## The Problem
The error `error parsing value for field "CORS_ORIGINS"` occurs because the CORS_ORIGINS value in your `.env` file is not in the correct format.

## The Solution

Open `backend\.env` and find the line with `CORS_ORIGINS`. Change it to:

**WRONG (causes error):**
```env
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

**CORRECT:**
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

Or for a single origin:
```env
CORS_ORIGINS=http://localhost:3000
```

## Complete Minimal .env Configuration

Here's a working minimal configuration for your `.env` file:

```env
# Database (using SQLite - no PostgreSQL needed)
DATABASE_URL=sqlite:///./checkerq.db

# JWT Configuration
SECRET_KEY=your-super-secret-key-change-this-in-production-min-32-chars
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=7

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# CORS - Allow admin portal (comma-separated, no brackets)
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# Optional - Comment out if not using Redis
# REDIS_URL=redis://localhost:6379

# File Upload
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760
```

## After Fixing

1. Save the `.env` file
2. Run the server:
   ```bash
   venv\Scripts\activate
   uvicorn app.main:app --reload
   ```

The server should start successfully on http://localhost:8000

# Environment Configuration Guide

This document explains the environment variables used in the CheckerQ project.

## Admin Portal (.env)

The admin portal uses Vite, so all environment variables must be prefixed with `VITE_`.

### Required Variables

```env
# API Configuration
VITE_API_URL=http://localhost:8000
```

- **VITE_API_URL**: The base URL for the backend API
  - Development: `http://localhost:8000`
  - Production: Your deployed backend URL

### Optional Variables

```env
# Environment
VITE_ENVIRONMENT=development
```

- **VITE_ENVIRONMENT**: Current environment (development/staging/production)

### Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cd admin-portal
   cp .env.example .env
   ```

2. Update the values as needed for your environment

3. Restart the dev server for changes to take effect

## Backend (.env)

The backend uses Python with Pydantic settings management.

### Database Configuration

```env
DATABASE_URL=postgresql://checkerq:checkerq123@localhost:5432/checkerq_db
REDIS_URL=redis://localhost:6379/0
```

- **DATABASE_URL**: PostgreSQL connection string
- **REDIS_URL**: Redis connection string for caching/sessions

### JWT Configuration

```env
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30
```

- **SECRET_KEY**: Secret key for JWT signing (⚠️ **CHANGE IN PRODUCTION**)
- **ALGORITHM**: JWT signing algorithm
- **ACCESS_TOKEN_EXPIRE_MINUTES**: Access token lifetime
- **REFRESH_TOKEN_EXPIRE_DAYS**: Refresh token lifetime

### Google OAuth

```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

- **GOOGLE_CLIENT_ID**: OAuth 2.0 client ID from Google Cloud Console
- **GOOGLE_CLIENT_SECRET**: OAuth 2.0 client secret

To obtain these:
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs

### AI API Keys

```env
GEMINI_API_KEY=your-gemini-api-key
MISTRAL_API_KEY=your-mistral-api-key
```

- **GEMINI_API_KEY**: Google Gemini API key for AI evaluation
- **MISTRAL_API_KEY**: Mistral AI API key (optional alternative)

To obtain:
- Gemini: [Google AI Studio](https://makersuite.google.com/app/apikey)
- Mistral: [Mistral AI Platform](https://console.mistral.ai/)

### CORS Configuration

```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

- **CORS_ORIGINS**: Comma-separated list of allowed origins
  - Add your admin portal URL
  - Add your mobile app development URL if applicable

### File Storage

```env
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760
```

- **UPLOAD_DIR**: Directory for uploaded files
- **MAX_UPLOAD_SIZE**: Maximum file size in bytes (default: 10MB)

### Environment

```env
ENVIRONMENT=development
DEBUG=True
```

- **ENVIRONMENT**: Current environment (development/staging/production)
- **DEBUG**: Enable debug mode (True/False)

### Setup

1. Copy `.env.example` to `.env`:
   ```bash
   cd backend
   cp .env.example .env
   ```

2. Update all values, especially:
   - Change `SECRET_KEY` to a secure random string
   - Add your Google OAuth credentials
   - Add your AI API keys
   - Update CORS origins to match your frontend URLs

3. Restart the backend server for changes to take effect

## Security Notes

⚠️ **Important Security Considerations:**

1. **Never commit `.env` files** - They are gitignored for a reason
2. **Change default SECRET_KEY** - Use a cryptographically secure random string
3. **Rotate API keys regularly** - Especially in production
4. **Use environment-specific values** - Don't use development credentials in production
5. **Limit CORS origins** - Only allow trusted domains in production

## Production Deployment

For production deployments:

1. Use environment variables provided by your hosting platform
2. Never use default/example values
3. Enable HTTPS for all endpoints
4. Use strong, unique SECRET_KEY
5. Set DEBUG=False
6. Configure proper database backups
7. Use managed Redis service for reliability
8. Monitor API key usage and set rate limits

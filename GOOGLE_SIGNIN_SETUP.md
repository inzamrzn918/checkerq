# Google Sign-In Setup for Production

## Overview
Google Sign-In has been temporarily disabled in the development version because it requires native modules that are not compatible with Expo Go.

## Current Status

### ✅ Configuration Complete
- **Environment Variables**: Both backend and mobile app `.env` files have been created with Google OAuth credentials
- **Backend**: Ready to verify Google Sign-In tokens
- **Mobile App**: Configured with Google Web Client ID

### 🔄 Development Mode
- **Expo Go**: Google Sign-In is disabled (requires native modules)
- **Mock Authentication**: Available for testing app features during development

### 🚀 Next Steps for Production
- Create a development build or production APK to enable real Google Sign-In
- Test the authentication flow with actual Google accounts

## Configuration Steps (Completed)

The following steps have been completed to set up Google Sign-In:

### Step 1: Install Dependencies
```bash
npm install @react-native-google-signin/google-signin
```

### Step 2: Configure Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google Sign-In API
4. Create OAuth 2.0 credentials:
   - **Web client ID** (for backend)
   - **Android client ID** (for mobile app)

### Step 3: Get SHA-1 Fingerprint
For development:
```bash
cd android
./gradlew signingReport
```

For production, use your keystore's SHA-1.

### Step 4: Configure Environment Variables

#### Backend Configuration
Create `backend/.env` file with your Google OAuth credentials:
```env
# Database
DATABASE_URL=postgresql://checkerq:checkerq123@localhost:5432/checkerq_db

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=30

# Google OAuth
GOOGLE_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret

# AI APIs
GEMINI_API_KEY=your-gemini-api-key
MISTRAL_API_KEY=your-mistral-api-key

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173

# File Storage
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE=10485760

# Environment
ENVIRONMENT=development
DEBUG=True
```

#### Mobile App Configuration
Create `.env` file in the project root:
```env
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.apps.googleusercontent.com
```

> **Note:** Use the same **Web Client ID** in both files. The backend uses it for token verification, and the mobile app uses it for the Google Sign-In flow.

### Step 5: Restore authService
Uncomment the Google Sign-In code in `src/services/authService.ts` and restore the original implementation.

### Step 6: Create Development Build
```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Create development build
eas build --profile development --platform android
```

### Step 7: Install and Test
Install the development build APK on your device and test Google Sign-In.

## Alternative: Skip Authentication for Development

The current implementation allows skipping authentication in development mode. To enable this:

1. Open `src/services/authService.ts`
2. Uncomment the mock user code in `signInWithGoogle()`:
```typescript
async signInWithGoogle(): Promise<UserProfile | null> {
    // Uncomment for development testing
    try {
        const mockUser: UserProfile = {
            id: 'dev-user',
            email: 'dev@checkerq.com',
            name: 'Development User',
        };
        return mockUser;
    } catch (error) {
        console.error('Mock sign in error:', error);
    }
    return null;
}
```

This allows you to bypass authentication and test the app's features during development.

## Resources
- [Expo Development Builds](https://docs.expo.dev/develop/development-builds/introduction/)
- [Google Sign-In for React Native](https://github.com/react-native-google-signin/google-signin)
- [Google Cloud Console](https://console.cloud.google.com/)

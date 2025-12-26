# CheckerQ Project

An AI-powered exam evaluation system with admin portal backend.

## Project Structure

```
checkerq/
├── src/                    # Mobile app source (React Native + Expo)
├── backend/                # Backend API (FastAPI + PostgreSQL)
└── admin-portal/           # Admin web portal (React + Vite)
```

## Components

### Mobile App
- React Native with Expo
- AI-powered exam evaluation
- SQLite local storage
- Camera integration

### Backend API
- FastAPI with PostgreSQL
- JWT authentication + Google OAuth
- License management system
- User management
- Analytics tracking

### Admin Portal
- React + TypeScript + Vite
- Dashboard with charts
- User management
- License generation
- Real-time analytics

## Quick Start

### Mobile App
```bash
npm install
npm start
```

**For Android setup:** See [ANDROID_SETUP.md](./ANDROID_SETUP.md) for detailed instructions on configuring the app to connect to your backend.

### Backend
```bash
cd backend
docker-compose up -d
# OR
setup.bat
# For network access (required for Android):
uvicorn app.main:app --host 0.0.0.0 --reload
```

### Admin Portal
```bash
cd admin-portal
npm install
npm run dev
```

## Documentation

- **Android Setup:** [ANDROID_SETUP.md](./ANDROID_SETUP.md)
- Mobile App: [README.md](./README.md)
- Backend: [backend/README.md](./backend/README.md)
- Admin Portal: [admin-portal/README.md](./admin-portal/README.md)

## License

Proprietary

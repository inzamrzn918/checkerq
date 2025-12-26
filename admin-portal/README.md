# CheckerQ Admin Portal

Modern admin dashboard for managing the CheckerQ exam evaluation system.

## Features

- 📊 **Dashboard** - Real-time statistics and analytics
- 👥 **User Management** - View, search, and manage users
- 🔑 **License Management** - Generate and track license keys
- 📈 **Analytics** - Visualize usage patterns and trends
- ⚙️ **Settings** - Configure system parameters

## Tech Stack

- **React 18** with TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Recharts** - Beautiful charts
- **React Router** - Client-side routing
- **Axios** - HTTP client

## Getting Started

### Installation

```bash
cd admin-portal
npm install
```

### Development

```bash
npm run dev
```

The portal will be available at `http://localhost:3000`

### Build

```bash
npm run build
```

## Project Structure

```
admin-portal/
├── src/
│   ├── components/     # Reusable components
│   │   ├── Sidebar.tsx
│   │   └── StatCard.tsx
│   ├── pages/          # Page components
│   │   ├── Dashboard.tsx
│   │   ├── UsersPage.tsx
│   │   └── LicensesPage.tsx
│   ├── lib/            # Utilities
│   │   └── api.ts      # API client
│   ├── types/          # TypeScript types
│   ├── App.tsx         # Main app component
│   └── main.tsx        # Entry point
├── public/             # Static assets
└── package.json
```

## API Integration

The portal connects to the backend API at `http://localhost:8000`. Configure the API URL in `.env`:

```env
VITE_API_URL=http://localhost:8000
```

## Features

### Dashboard
- Key metrics cards
- User growth chart
- Evaluations trend
- License distribution
- Recent activity feed

### User Management
- Search and filter users
- View user details
- Suspend/delete users
- Role management

### License Management
- Generate bulk licenses
- Copy license keys
- Track activation status
- Revoke licenses

## License

Proprietary

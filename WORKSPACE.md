# CheckerQ - Shared Dependencies Setup

This project uses npm workspaces to share dependencies between the mobile app and admin portal.

## Structure

```
checkerq/
├── node_modules/          # Shared dependencies
├── package.json           # Root workspace config
├── src/                   # Mobile app
├── admin-portal/          # Admin portal
│   └── package.json       # Admin portal dependencies
└── backend/               # Backend API
```

## Installation

**Install all dependencies:**
```bash
npm install
```

This will install:
- Mobile app dependencies (root)
- Admin portal dependencies (workspace)
- Shared dependencies in root `node_modules/`

## Running Projects

**Mobile App:**
```bash
npm start
```

**Admin Portal:**
```bash
npm run admin
# OR
cd admin-portal && npm run dev
```

**Backend:**
```bash
cd backend
docker-compose up -d
```

## Benefits

✅ **Disk Space**: Single `node_modules` folder instead of two
✅ **Faster Installs**: Shared dependencies installed once
✅ **Easier Updates**: Update shared packages in one place
✅ **Consistency**: Same package versions across projects

## Workspace Commands

```bash
# Install all dependencies
npm install

# Run admin portal dev server
npm run admin

# Install only admin portal dependencies
npm install --workspace=admin-portal

# Add package to admin portal
npm install <package> --workspace=admin-portal

# Add package to mobile app (root)
npm install <package>
```

## Notes

- Mobile app dependencies are in root `package.json`
- Admin portal dependencies are in `admin-portal/package.json`
- Shared dependencies (like React, TypeScript) are hoisted to root
- Workspace-specific dependencies stay in their respective folders

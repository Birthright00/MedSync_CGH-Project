# Project Dependencies

## Frontend Dependencies (Root package.json)

### Runtime Dependencies
```json
{
  "@testing-library/jest-dom": "^5.17.0",
  "@testing-library/react": "^13.4.0", 
  "@testing-library/user-event": "^13.5.0",
  "axios": "^1.7.7",
  "bcrypt": "^6.0.0",
  "bootstrap": "^5.3.3",
  "concurrently": "^9.1.0",
  "cors": "^2.8.5",
  "csv-parser": "^3.2.0",
  "date": "^2.0.5",
  "datepicker": "^0.0.0",
  "express": "^4.21.0",
  "file-saver": "^2.0.5",
  "framer-motion": "^11.4.0",
  "html2canvas": "^1.4.1",
  "jsonwebtoken": "^9.0.2",
  "jspdf": "^3.0.1",
  "jszip": "^3.10.1",
  "jwt-decode": "^4.0.0",
  "moment": "^2.30.1",
  "msal": "^1.4.18",
  "multer": "^2.0.0",
  "mysql": "^2.18.1",
  "mysql2": "^3.11.3",
  "nodemon": "^3.1.4",
  "papaparse": "^5.5.3",
  "react": "^18.3.1",
  "react-big-calendar": "^1.19.2",
  "react-confirm-alert": "^3.0.6",
  "react-csv": "^2.2.2",
  "react-datepicker": "^7.3.0",
  "react-dnd": "^16.0.1",
  "react-dnd-html5-backend": "^16.0.1",
  "react-dom": "^18.3.1",
  "react-icons": "^5.5.0",
  "react-router-dom": "^6.26.1",
  "react-scripts": "^5.0.1",
  "react-select": "^5.10.2",
  "react-toastify": "^10.0.6",
  "react-transition-group": "^4.4.5",
  "uuid": "^11.1.0",
  "web-vitals": "^2.1.4",
  "xlsx": "^0.18.5"
}
```

### Development Dependencies
```json
{
  "@babel/plugin-proposal-private-property-in-object": "^7.21.11",
  "gh-pages": "^6.2.0",
  "vite-plugin-qrcode": "^0.2.4"
}
```

## Backend Dependencies (backend/package.json)

### Runtime Dependencies
```json
{
  "bcrypt": "^5.1.1",
  "cors": "^2.8.5",
  "csv-parser": "^3.0.0",
  "express": "^4.21.0",
  "jsonwebtoken": "^9.0.2",
  "multer": "^1.4.5-lts.1",
  "mysql": "^2.18.1",
  "mysql2": "^3.11.3",
  "xlsx": "^0.18.5"
}
```

## Critical Dependencies

### MSAL (Microsoft Authentication Library)
- **Package**: `msal@^1.4.18`
- **Status**: ⚠️ DEPRECATED - Consider upgrading to `@azure/msal-browser`
- **Purpose**: Microsoft Graph API authentication for email integration
- **Critical**: Required for email monitoring and AI parsing features

### React Ecosystem
- **react**: `^18.3.1`
- **react-dom**: `^18.3.1`
- **react-router-dom**: `^6.26.1`
- **react-scripts**: `^5.0.1`

### Backend Core
- **express**: `^4.21.0`
- **mysql2**: `^3.11.3`
- **bcrypt**: `^5.1.1`
- **jsonwebtoken**: `^9.0.2`

## Installation Commands

### Complete Setup
```bash
# Install all dependencies (frontend + backend)
npm run setup

# Verify installation
npm run setup-check
```

### Individual Installation
```bash
# Frontend only
npm install

# Backend only
cd backend && npm install
```

### Clean Installation (if issues occur)
```bash
# Remove all node_modules and reinstall
npm run clean-install
```

## Known Issues & Solutions

1. **Missing MSAL**: Run `npm install` to ensure msal@^1.4.18 is installed
2. **Version Conflicts**: Use `npm run clean-install` to resolve
3. **Backend Dependencies**: Must be installed separately in `/backend` folder
4. **Deprecated Packages**: Monitor for security updates

## Version Requirements

- **Node.js**: 16.x or higher (LTS recommended)
- **npm**: 8.x or higher
- **Python**: 3.7+ (for AI email parser)

## Security Notes

- Several dependencies have known vulnerabilities
- Run `npm audit` to check security issues
- Use `npm audit fix` to apply automatic fixes
- Consider updating deprecated packages in production
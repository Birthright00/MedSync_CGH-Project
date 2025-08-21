# CGH Project Setup Guide

## Quick Setup Instructions

### 1. Prerequisites
- Node.js (LTS version recommended): https://nodejs.org/
- Git: https://git-scm.com/downloads
- Visual Studio Code (recommended): https://code.visualstudio.com/

### 2. Installation Steps

```bash
# Clone the repository
git clone https://github.com/CoderJae777/CGH_Project.git
cd CGH_Project

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..

# Verify installation
npm run setup-check
```

### 3. Common Issues & Solutions

#### Missing Dependencies Error
If you encounter `npm error missing: msal@^1.4.18` or similar:

```bash
# Clean install (removes node_modules and reinstalls)
npm run clean-install
```

#### Manual Dependency Fix
```bash
# Delete node_modules and package-lock.json, then reinstall
rm -rf node_modules package-lock.json
npm install

# For backend
cd backend
rm -rf node_modules package-lock.json  
npm install
cd ..
```

### 4. Running the Application

```bash
# Start both frontend and backend (recommended)
npm start

# Or start individually
npm run frontend    # Frontend only
npm run backend     # Backend only
```

### 5. Verification

After installation, you should be able to:
- Access the frontend at http://localhost:3000
- Access the backend API at http://localhost:3001
- See login page without JavaScript errors

### 6. Development Credentials

| Role | Username | Password |
|------|----------|----------|
| Management | `abcde` | `test` |
| Staff | `m12345a` | `test` |
| HR | `bcdef` | `test` |

### 7. Troubleshooting

#### Port Already in Use
```bash
# Kill processes on ports 3000 and 3001
npx kill-port 3000 3001
```

#### Authentication Issues
- Clear browser cache
- Check `src/config/admin-emails.json` configuration
- Verify Microsoft Graph API credentials

#### Database Connection Issues
- Ensure MySQL is running
- Check backend/server.js for database configuration
- Verify database credentials

### 8. Next Steps

- Review the main [README.md](./README.md) for detailed feature documentation
- Check the AI email parser setup if using scheduling features
- Configure Microsoft Graph API for email integration

---

For additional help, contact the repository maintainer or check the issues section.
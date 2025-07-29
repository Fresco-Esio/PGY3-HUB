# PGY3-HUB Setup Guide

## Prerequisites Installation

### 1. Install Node.js (Required for Frontend)
1. Download Node.js LTS version from: https://nodejs.org/
2. Run the installer and follow the setup wizard
3. Verify installation by opening PowerShell and running:
   ```powershell
   node --version
   npm --version
   ```

### 2. Install Python (Required for Backend)
1. Download Python 3.9+ from: https://www.python.org/downloads/
2. **IMPORTANT**: Check "Add Python to PATH" during installation
3. Verify installation:
   ```powershell
   python --version
   pip --version
   ```

## Quick Setup & Installation

### Frontend Setup
```powershell
# Navigate to frontend directory
cd "c:\Users\Obioe\OneDrive - Montefiore Medicine (1)\Projects\PGY3-HUB-main\PGY3-HUB-main\frontend"

# Install dependencies
npm install

# Start development server
npm start
```

### Backend Setup (Python - Primary)
```powershell
# Navigate to backend directory
cd "c:\Users\Obioe\OneDrive - Montefiore Medicine (1)\Projects\PGY3-HUB-main\PGY3-HUB-main\backend"

# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
.\venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn server:app --reload --port 8001
```

### Backend Setup (Node.js - Alternative)
```powershell
# Navigate to backend directory
cd "c:\Users\Obioe\OneDrive - Montefiore Medicine (1)\Projects\PGY3-HUB-main\PGY3-HUB-main\backend"

# Install dependencies
npm install

# Start backend server
node server.js
```

## Development Workflow

### Option 1: Use the Built-in Development Script (Recommended)
```powershell
# Navigate to frontend directory
cd "c:\Users\Obioe\OneDrive - Montefiore Medicine (1)\Projects\PGY3-HUB-main\PGY3-HUB-main\frontend"

# This starts both backend and frontend together
npm run dev
```

### Option 2: Start Services Manually
```powershell
# Terminal 1 - Backend (Python)
cd "c:\Users\Obioe\OneDrive - Montefiore Medicine (1)\Projects\PGY3-HUB-main\PGY3-HUB-main\backend"
.\venv\Scripts\Activate.ps1
uvicorn server:app --reload --port 8001

# Terminal 2 - Frontend
cd "c:\Users\Obioe\OneDrive - Montefiore Medicine (1)\Projects\PGY3-HUB-main\PGY3-HUB-main\frontend"
npm start
```

## Debugging & Testing

### Access Points
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8001 (Python) or http://localhost:8000 (Node.js)
- **API Documentation**: http://localhost:8001/docs (FastAPI auto-generated docs)

### Key Debugging Tips
1. **Browser Console**: Check for JavaScript errors and network requests
2. **Network Tab**: Monitor API calls between frontend and backend
3. **Backend Logs**: Watch terminal output for server errors
4. **Data Storage**: Check `backend/mindmap_data.json` for data persistence

### Common Issues & Solutions

#### 1. Port Conflicts
If ports are in use, modify the scripts:
```json
// In frontend/package.json
"start-backend": "cd ../backend && uvicorn server:app --reload --port 8002"
```

#### 2. CORS Errors
Ensure backend CORS is configured for frontend URL in `server.py` or `server.js`

#### 3. API Connection Issues
Check the API URL in frontend. Look for:
```javascript
const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
```

#### 4. Missing Dependencies
If you get import errors, ensure all packages are installed:
```powershell
# Frontend
cd frontend && npm install

# Backend Python
cd backend && pip install -r requirements.txt

# Backend Node.js
cd backend && npm install
```

## Development Features

### Hot Reload
- Frontend: Automatic reload on file changes
- Backend Python: `--reload` flag enables auto-restart
- Backend Node.js: Use `nodemon` for auto-restart

### Data Persistence
- Data is saved to `backend/mindmap_data.json` or `backend/mindmap-data.json`
- Auto-save every 800ms with local storage backup
- File uploads stored in `backend/uploads/`

### Performance Monitoring
- React DevTools for component debugging
- Browser Performance tab for rendering issues
- Network tab for API call optimization

## Testing the Application

### Basic Functionality Test
1. Open http://localhost:3000
2. Create a new node (Ctrl+N)
3. Edit node content
4. Create connections between nodes
5. Verify data saves automatically
6. Refresh page to test data persistence

### Advanced Features Test
- Upload PDF files in literature nodes
- Use rich text editor for content
- Test keyboard shortcuts (Ctrl+R for realign, Esc to clear selection)
- Test template system for quick node creation
- Verify force-directed layout algorithm

## Troubleshooting

### PowerShell Execution Policy Issues
If you get execution policy errors:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Path Issues
Always use full paths in PowerShell or navigate to directories first:
```powershell
cd "c:\Users\Obioe\OneDrive - Montefiore Medicine (1)\Projects\PGY3-HUB-main\PGY3-HUB-main"
```

### Environment Variables
Create a `.env` file in the frontend directory for custom configuration:
```
REACT_APP_BACKEND_URL=http://localhost:8001
```

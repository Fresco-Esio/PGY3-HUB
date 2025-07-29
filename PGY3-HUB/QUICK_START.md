# Quick Development Scripts for PGY3-HUB

## Quick Start (After Installing Node.js and Python)

### 1. Install Everything
```powershell
# Run this script to install all dependencies
cd "c:\Users\Obioe\OneDrive - Montefiore Medicine (1)\Projects\PGY3-HUB-main\PGY3-HUB-main"

# Frontend dependencies
cd frontend
npm install

# Backend Python dependencies
cd ..\backend
python -m pip install -r requirements.txt

# Backend Node.js dependencies (optional)
npm install
```

### 2. Start Development (Choose One)

#### Option A: Automatic (Both Frontend & Backend)
```powershell
cd "c:\Users\Obioe\OneDrive - Montefiore Medicine (1)\Projects\PGY3-HUB-main\PGY3-HUB-main\frontend"
npm run dev
```

#### Option B: Manual (Separate Terminals)
Terminal 1 - Backend:
```powershell
cd "c:\Users\Obioe\OneDrive - Montefiore Medicine (1)\Projects\PGY3-HUB-main\PGY3-HUB-main\backend"
uvicorn server:app --reload --port 8001
```

Terminal 2 - Frontend:
```powershell
cd "c:\Users\Obioe\OneDrive - Montefiore Medicine (1)\Projects\PGY3-HUB-main\PGY3-HUB-main\frontend"
npm start
```

## Testing URLs
- **Application**: http://localhost:3000
- **API Docs**: http://localhost:8001/docs
- **API Health**: http://localhost:8001/health

## Development Commands

### Frontend Commands
```powershell
cd frontend

# Start development server
npm start

# Build for production
npm run build

# Run tests
npm test

# Start both frontend and backend
npm run dev
```

### Backend Commands (Python)
```powershell
cd backend

# Start with auto-reload
uvicorn server:app --reload --port 8001

# Start in production mode
uvicorn server:app --host 0.0.0.0 --port 8001

# Install new package
pip install package_name
pip freeze > requirements.txt
```

### Backend Commands (Node.js Alternative)
```powershell
cd backend

# Start server
node server.js

# Install new package
npm install package_name
```

## Debugging Features

### Browser DevTools
1. Open Chrome/Edge DevTools (F12)
2. **Console**: Check for JavaScript errors
3. **Network**: Monitor API calls
4. **Application**: Inspect Local Storage data
5. **Sources**: Set breakpoints in React code

### Backend Debugging
1. **FastAPI Docs**: http://localhost:8001/docs - Interactive API testing
2. **Server Logs**: Check terminal output for errors
3. **Data Files**: Monitor `backend/mindmap_data.json` for changes

### React DevTools (Recommended)
Install React Developer Tools browser extension for advanced React debugging.

## Quick Test Checklist

### Basic Functionality
- [ ] Application loads at http://localhost:3000
- [ ] Can create new nodes (Ctrl+N)
- [ ] Can edit node content
- [ ] Can create connections between nodes
- [ ] Data saves automatically
- [ ] Data persists after page refresh

### Advanced Features
- [ ] Rich text editor works in node content
- [ ] PDF upload works in literature nodes
- [ ] Keyboard shortcuts work (Ctrl+R, Esc)
- [ ] Force layout algorithm works
- [ ] Templates can be created and used

## Common Issues & Quick Fixes

### 1. "npm command not found"
**Solution**: Install Node.js from https://nodejs.org/

### 2. "python command not found"
**Solution**: Install Python and add to PATH

### 3. "Port 3000 already in use"
**Solution**: 
```powershell
# Find process using port
netstat -ano | findstr :3000
# Kill process (replace PID)
taskkill /PID <PID> /F
```

### 4. "CORS Error"
**Solution**: Ensure backend is running on port 8001 and CORS is configured

### 5. "Module not found"
**Solution**: 
```powershell
# Frontend
cd frontend && npm install

# Backend
cd backend && pip install -r requirements.txt
```

### 6. API Connection Failed
**Solution**: Check if backend is running and accessible at http://localhost:8001/health

## Performance Tips

### For Development
- Use `npm run dev` to start both services together
- Keep browser devtools open to monitor performance
- Use React DevTools Profiler for component performance
- Monitor network tab for API call optimization

### For Production
- Run `npm run build` to create optimized build
- Use production environment variables
- Enable gzip compression
- Consider CDN for static assets

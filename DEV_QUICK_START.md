# PGY3-HUB Development Environment

## Quick Start Options

### Option 1: One-Click Start (Recommended)
**Windows:**
```bash
# Double-click or run in PowerShell
.\quick-start.ps1
```

**Windows Command Prompt:**
```bash
quick-start.bat
```

**Linux/Mac:**
```bash
chmod +x quick-start.sh
./quick-start.sh
```

### Option 2: Manual Commands

#### Start with Python FastAPI Backend (Port 8001)
```bash
cd frontend
npm run dev-python
```

#### Start with Node.js Express Backend (Port 8000)
```bash
cd frontend
npm run dev-node
```

#### Start Frontend Only
```bash
cd frontend
npm run frontend-only
```

#### Start Backend Only
**Python:**
```bash
cd frontend
npm run backend-only-python
```

**Node.js:**
```bash
cd frontend
npm run backend-only-node
```

## URLs After Starting

- **Frontend:** http://localhost:3000
- **Python Backend:** http://localhost:8001
- **Node.js Backend:** http://localhost:8000
- **Python Backend API Docs:** http://localhost:8001/docs
- **Node.js Backend API Docs:** http://localhost:8000/api-docs (if configured)

## Development Tips

1. **Settings Testing:** Once servers are running, you can test the new settings tab for color customization
2. **Hot Reload:** Both frontend (React) and backend (FastAPI/Express) support hot reload
3. **Error Handling:** If ports are in use, the scripts will show error messages
4. **Stopping Servers:** Press `Ctrl+C` in the terminal to stop both servers

## Troubleshooting

### Port Already in Use
If you get port errors:
```bash
# Kill processes on specific ports (Windows)
netstat -ano | findstr :3000
taskkill /PID <PID> /F

netstat -ano | findstr :8000
taskkill /PID <PID> /F

netstat -ano | findstr :8001
taskkill /PID <PID> /F
```

### Python Virtual Environment Issues
```bash
cd backend
python -m venv venv --clear
venv\Scripts\activate  # Windows
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### npm Issues
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

```bash
cd backend  # For Node.js backend
rm -rf node_modules package-lock.json
npm install
```

## Features Ready for Testing

✅ **Settings Tab Implementation:**
- Color customization for psychiatric categories
- Node type color controls (Case, Task, Literature)
- Real-time color updates
- Persistent storage with localStorage
- Reset to defaults functionality

✅ **Modal Integrations:**
- TopicModal with category colors
- CaseModal with custom case colors
- TaskModal with custom task colors  
- LiteratureModal with custom literature colors

✅ **Mind Map Functionality:**
- Interactive node creation and editing
- Drag-and-drop positioning
- Connection management
- Auto-save with backend sync

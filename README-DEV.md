# 🚀 PGY3-HUB Quick Development Setup

## One-Command Start

### Windows
```bash
start-dev.bat
```
*Double-click the file or run in Command Prompt*

### Linux/Mac  
```bash
chmod +x start-dev.sh
./start-dev.sh
```

## What This Does
- ✅ Starts Python FastAPI backend on **http://localhost:8001**
- ✅ Starts React frontend on **http://localhost:3000**  
- ✅ Enables hot reload for both frontend and backend
- ✅ Ready to test the new **Settings Tab** implementation

## Alternative Commands

### Start Everything (from frontend directory)
```bash
npm run dev-python    # Python backend + React frontend
npm run dev-node      # Node.js backend + React frontend
```

### Start Individual Components
```bash
npm run frontend-only           # React only on :3000
npm run backend-only-python     # Python backend only on :8001
npm run backend-only-node       # Node.js backend only on :8000
```

## Testing the Settings Implementation

Once servers are running:

1. **Open:** http://localhost:3000
2. **Find:** Settings icon in the left sidebar  
3. **Test:** 
   - Click to expand/collapse settings panel
   - Use color pickers for psychiatric categories
   - Adjust node type colors for Case/Task/Literature
   - Click "Reset to Defaults" button
   - Create nodes and see custom colors applied

## URLs
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8001  
- **API Documentation:** http://localhost:8001/docs

## Stop Servers
Press `Ctrl+C` in the terminal running the servers

---

**Ready to test your new Settings Tab! 🎨**

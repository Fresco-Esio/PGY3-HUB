# 🔥 PGY3-HUB Development Shortcuts & Hot Reload

This document provides information about all the available shortcuts and tools for efficient development and testing of PGY3-HUB with hot reload capabilities.

## 🚀 Quick Start Options

### 1. **Enhanced Hot Reload Development** (Recommended)
```powershell
# PowerShell (Advanced features)
.\dev-hotreload.ps1

# Batch file (Simple)
.\dev-hotreload.bat
```

**Features:**
- ⚡ Auto-restart backend on file changes
- 🔄 Auto-refresh frontend on React/CSS/JS changes  
- 🧹 Automatic port cleanup
- 📊 Service status monitoring
- 🐍 Python or 🟢 Node.js backend options
- 🧪 Test mode with debug logging

### 2. **Original Quick Start** (Updated)
```batch
.\start-dev.bat
```
Enhanced with hot reload information and testing URLs.

### 3. **VS Code Tasks** (Built-in)
- Press `Ctrl+Shift+P` → "Tasks: Run Task"
- Select from available tasks:
  - 🚀 Start Hot Reload Development
  - 🐍 Start Python Backend Only
  - ⚛️ Start React Frontend Only
  - 🧪 Quick Test Runner
  - 📊 Service Status
  - 🧹 Clean Environment
  - 📦 Build Production

## 🛠️ Advanced Development Tools

### Quick Actions Script
```powershell
# Show all available actions
.\quick-actions.ps1 help

# Quick service status check
.\quick-actions.ps1 status

# Start development with Python backend
.\quick-actions.ps1 start -Python

# Run tests
.\quick-actions.ps1 test

# Clean environment
.\quick-actions.ps1 clean

# Build production
.\quick-actions.ps1 build

# Reset everything
.\quick-actions.ps1 reset
```

### Test Runner Menu
```batch
.\test-runner.bat
```
Interactive menu with options:
1. Full Development Environment
2. Backend Only Test
3. Frontend Only Test
4. API Endpoint Tests
5. Hot Reload Test Mode
6. Node.js Backend Test
7. Quick Health Check
8. Custom Test

## ⚡ Hot Reload Features

### Frontend Hot Reload
- **React Components**: Instant updates without losing state
- **CSS/Tailwind**: Live style updates
- **JavaScript**: Automatic refresh on save
- **Asset Files**: Auto-reload for images, fonts, etc.

### Backend Hot Reload
- **Python FastAPI**: `uvicorn --reload` auto-restarts server
- **API Endpoints**: Live documentation updates at `/docs`
- **Database Models**: Automatic schema updates
- **Configuration**: Environment variable updates

### Development URLs
- 🔗 **Frontend**: http://localhost:3000
- 🔗 **Backend**: http://localhost:8001  
- 🔗 **API Docs**: http://localhost:8001/docs
- 🔗 **Health Check**: http://localhost:8001/health

## 🎯 Command Line Options

### PowerShell Script Options
```powershell
# Use Node.js backend instead of Python
.\dev-hotreload.ps1 -Backend node

# Enable test mode with debug logging  
.\dev-hotreload.ps1 -TestMode

# Use custom frontend port
.\dev-hotreload.ps1 -Port 3001

# Combine options
.\dev-hotreload.ps1 -Backend node -TestMode -Port 3001
```

### Batch File Options
```batch
# Use Node.js backend
.\dev-hotreload.bat --node

# Enable test mode
.\dev-hotreload.bat --test

# Custom port
.\dev-hotreload.bat --port 3001

# Combine options
.\dev-hotreload.bat --node --test --port 3001
```

## 🧪 Testing Shortcuts

### Quick Test Commands
```powershell
# Run all tests
.\quick-actions.ps1 test

# Frontend unit tests only
cd frontend && npm test

# Backend API tests  
python comprehensive_backend_test.py

# Health check
curl http://localhost:8001/health
```

### Test URLs for Manual Testing
- **Mind Map Interface**: http://localhost:3000
- **API Data Endpoint**: http://localhost:8001/mindmap-data
- **Backend Health**: http://localhost:8001/health
- **Swagger Docs**: http://localhost:8001/docs
- **ReDoc**: http://localhost:8001/redoc

## 🔧 Development Environment

### Environment Variables
The hot reload scripts automatically set:
```
REACT_APP_DEV_MODE=true
REACT_APP_HOT_RELOAD=true  
REACT_APP_BACKEND_URL=http://localhost:8001
```

In test mode, additional variables:
```
REACT_APP_TEST_MODE=true
REACT_APP_LOG_LEVEL=debug
```

### Prerequisites Check
All scripts automatically verify:
- ✅ Node.js and npm installed
- ✅ Python and pip installed (for Python backend)
- ✅ Required dependencies installed
- ✅ Ports 3000 and 8001 available

### Automatic Setup
Scripts handle:
- 🔄 Installing missing dependencies
- 🧹 Cleaning up existing processes
- 📁 Creating necessary directories
- 🔧 Setting environment variables

## 🚨 Troubleshooting

### Common Issues
1. **Port Already in Use**: Scripts automatically kill existing processes
2. **Missing Dependencies**: Auto-installation with npm/pip
3. **Python/Node Not Found**: Clear error messages with installation instructions
4. **Permission Issues**: Run PowerShell as Administrator if needed

### Debug Mode
Enable verbose logging:
```powershell
.\dev-hotreload.ps1 -TestMode
.\quick-actions.ps1 start -Verbose
```

### Service Status
Check what's running:
```powershell
.\quick-actions.ps1 status
netstat -an | findstr "3000 8001"
```

### Clean Reset
If everything breaks:
```powershell
.\quick-actions.ps1 reset
```

## 📱 VS Code Integration

### Keyboard Shortcuts
- `Ctrl+Shift+P` → "Tasks: Run Task" → Select task
- `F5` → Start debugging (Full Stack Debug)
- `Ctrl+F5` → Run without debugging

### Recommended Extensions
The `.vscode/extensions.json` includes:
- Python extension for backend debugging
- Tailwind CSS for styling support  
- Prettier for code formatting
- Live Server for preview
- REST Client for API testing

### Debug Configurations
Available in Run and Debug panel:
- 🚀 Launch PGY3-HUB Development
- 🐍 Debug Python Backend
- 🟢 Debug Node.js Backend  
- 🧪 Run Tests
- 🔥 Full Stack Debug (compound)

## 🎉 Quick Reference

| Action | Command | Description |
|--------|---------|-------------|
| **Start Development** | `.\dev-hotreload.ps1` | Full hot reload environment |
| **Quick Status** | `.\quick-actions.ps1 status` | Check running services |
| **Run Tests** | `.\test-runner.bat` | Interactive test menu |
| **Clean Up** | `.\quick-actions.ps1 clean` | Stop services, clean files |
| **Build Production** | `.\quick-actions.ps1 build` | Create production build |
| **Reset Everything** | `.\quick-actions.ps1 reset` | Complete environment reset |

## 💡 Pro Tips

1. **Use PowerShell scripts** for advanced features and better error handling
2. **Enable test mode** when debugging to get detailed logs
3. **Check service status** before starting if you encounter issues
4. **Use VS Code tasks** for integrated development workflow
5. **Set up keyboard shortcuts** for frequently used tasks
6. **Monitor the terminal output** for real-time feedback
7. **Use the health check endpoint** to verify backend connectivity

---

Happy coding! 🎯 The hot reload features will make your PGY3-HUB development much more efficient.

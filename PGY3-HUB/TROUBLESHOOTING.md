# PGY3-HUB Troubleshooting Guide

## Prerequisites Check

### Required Software
- **Node.js**: Version 16.0.0 or higher
- **Python**: Version 3.9.0 or higher
- **npm**: Comes with Node.js
- **pip**: Comes with Python

### Installation Links
- Node.js: https://nodejs.org/ (Download LTS version)
- Python: https://www.python.org/downloads/ (Check "Add to PATH" during installation)

## Quick Diagnosis Commands

Run these in PowerShell to check your environment:

```powershell
# Check Node.js and npm
node --version
npm --version

# Check Python and pip
python --version
pip --version

# Check if in correct directory
pwd
ls
```

Expected output:
- Node.js: v16.x.x or higher
- npm: 8.x.x or higher  
- Python: 3.9.x or higher
- pip: 21.x.x or higher

## Installation Issues

### Issue: "node is not recognized"
**Cause**: Node.js not installed or not in PATH
**Solution**:
1. Download Node.js from https://nodejs.org/
2. Run installer with default settings
3. Restart PowerShell
4. Test: `node --version`

### Issue: "python is not recognized"
**Cause**: Python not installed or not in PATH
**Solution**:
1. Download Python from https://www.python.org/downloads/
2. **IMPORTANT**: Check "Add Python to PATH" during installation
3. Restart PowerShell
4. Test: `python --version`

### Issue: "npm install" fails
**Causes & Solutions**:

1. **Network/Proxy Issues**:
   ```powershell
   npm config set registry https://registry.npmjs.org/
   npm cache clean --force
   npm install
   ```

2. **Permission Issues**:
   ```powershell
   # Run PowerShell as Administrator
   npm install -g npm@latest
   ```

3. **Corrupted node_modules**:
   ```powershell
   rm -r node_modules
   rm package-lock.json
   npm install
   ```

### Issue: "pip install" fails
**Solutions**:

1. **Upgrade pip**:
   ```powershell
   python -m pip install --upgrade pip
   ```

2. **Virtual Environment (Recommended)**:
   ```powershell
   cd backend
   python -m venv venv
   .\venv\Scripts\Activate.ps1
   pip install -r requirements.txt
   ```

3. **Manual Installation**:
   ```powershell
   pip install fastapi uvicorn pydantic
   ```

## Runtime Issues

### Issue: "Port 3000 already in use"
**Solution**:
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Kill the process (replace <PID> with actual PID)
taskkill /PID <PID> /F

# Or use different port
set PORT=3001 && npm start
```

### Issue: "Port 8001 already in use"
**Solution**:
```powershell
# Find and kill process
netstat -ano | findstr :8001
taskkill /PID <PID> /F

# Or use different port
uvicorn server:app --reload --port 8002
```

### Issue: CORS Errors in Browser
**Symptoms**: Console shows "CORS policy" errors
**Solution**:
1. Ensure backend is running on port 8001
2. Check `server.py` CORS configuration:
   ```python
   from fastapi.middleware.cors import CORSMiddleware
   
   app.add_middleware(
       CORSMiddleware,
       allow_origins=["http://localhost:3000"],
       allow_credentials=True,
       allow_methods=["*"],
       allow_headers=["*"],
   )
   ```

### Issue: "API connection failed"
**Diagnosis**:
1. Check if backend is running: http://localhost:8001/health
2. Check browser console for network errors
3. Verify API URL in frontend code

**Solution**:
```powershell
# Restart backend
cd backend
uvicorn server:app --reload --port 8001
```

### Issue: Database/Data not saving
**Symptoms**: Changes don't persist after refresh
**Diagnosis**:
1. Check if `backend/mindmap_data.json` exists
2. Check browser Local Storage in DevTools
3. Check backend logs for save errors

**Solution**:
1. Ensure backend has write permissions to directory
2. Check if file exists and is writable:
   ```powershell
   cd backend
   ls -la mindmap_data.json
   ```

### Issue: Rich Text Editor not working
**Symptoms**: Text formatting toolbar missing or not functional
**Solution**:
1. Check browser console for TipTap errors
2. Ensure all frontend dependencies installed:
   ```powershell
   cd frontend
   npm list @tiptap/react @tiptap/starter-kit
   ```

### Issue: Mind Map visualization not loading
**Symptoms**: Blank screen or React Flow errors
**Solution**:
1. Check for React Flow style import in App.js:
   ```javascript
   import '@xyflow/react/dist/style.css';
   ```
2. Check browser console for D3 loading errors
3. Clear browser cache and reload

## Development Issues

### Issue: Hot reload not working
**Solution**:
1. Ensure using `npm start` or `npm run dev`
2. Check if DISABLE_HOT_RELOAD environment variable is set
3. Try restarting development server

### Issue: Build fails
**Common causes**:
1. **TypeScript errors**: Check console for type errors
2. **Missing dependencies**: Run `npm install`
3. **Syntax errors**: Check linting errors
4. **Memory issues**: Increase Node.js memory:
   ```powershell
   set NODE_OPTIONS=--max-old-space-size=4096
   npm run build
   ```

### Issue: Tests failing
**Solution**:
```powershell
cd frontend
npm test -- --verbose
```

## Performance Issues

### Issue: Slow loading/rendering
**Solutions**:
1. **Check browser performance tab**
2. **Reduce data size**: Clear old mind map data
3. **Optimize React rendering**: Check React DevTools Profiler
4. **Enable production build**:
   ```powershell
   npm run build
   npx serve -s build
   ```

### Issue: Memory leaks
**Symptoms**: Browser becomes slow over time
**Solution**:
1. Check for console errors
2. Use React DevTools Profiler
3. Clear browser cache
4. Restart browser

## Environment-Specific Issues

### PowerShell Execution Policy
**Issue**: "execution of scripts is disabled"
**Solution**:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Windows Defender/Antivirus
**Issue**: npm install blocked or slow
**Solution**:
1. Add project folder to antivirus exclusions
2. Temporarily disable real-time protection during install

### WSL/Linux Subsystem Issues
**Issue**: Path or permission errors
**Solution**:
```bash
# Use Linux commands in WSL
sudo npm install -g npm@latest
chmod +x install_dependencies.sh
```

## Getting Help

### Debug Information to Collect
When reporting issues, include:

1. **System Info**:
   ```powershell
   node --version
   npm --version
   python --version
   pip --version
   ```

2. **Error Messages**: Full error text from console/terminal

3. **Browser Console**: Screenshots of browser DevTools errors

4. **Network Tab**: API call failures

5. **File Structure**: Verify all files are present:
   ```powershell
   ls frontend/
   ls backend/
   ```

### Log Files to Check
- Browser Console (F12)
- Terminal output where servers are running
- `backend/mindmap_data.json` for data persistence issues

### Useful Debugging URLs
- **Frontend**: http://localhost:3000
- **Backend Health**: http://localhost:8001/health
- **API Docs**: http://localhost:8001/docs
- **Backend Root**: http://localhost:8001/

### Emergency Reset
If everything breaks:
```powershell
# Clean install
rm -r frontend/node_modules
rm -r backend/node_modules
rm frontend/package-lock.json
rm backend/package-lock.json

# Reinstall
cd frontend && npm install
cd ../backend && npm install && pip install -r requirements.txt
```

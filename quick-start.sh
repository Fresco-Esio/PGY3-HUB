#!/bin/bash
# Quick start script for PGY3-HUB development

echo "🚀 PGY3-HUB Quick Start"
echo "======================"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command_exists node; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command_exists npm; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

if ! command_exists python; then
    echo "❌ Python is not installed. Please install Python first."
    exit 1
fi

echo "✅ All prerequisites found!"

# Choose backend type
echo ""
echo "🔧 Choose your backend:"
echo "1) Python FastAPI (Recommended)"
echo "2) Node.js Express"
read -p "Enter choice (1 or 2): " backend_choice

# Install frontend dependencies if needed
echo ""
echo "📦 Installing frontend dependencies..."
cd frontend
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✅ Frontend dependencies already installed"
fi

# Install backend dependencies based on choice
cd ../backend
echo ""
if [ "$backend_choice" = "1" ]; then
    echo "🐍 Setting up Python FastAPI backend..."
    if [ ! -d "venv" ]; then
        echo "Creating Python virtual environment..."
        python -m venv venv
    fi
    
    # Activate virtual environment
    source venv/bin/activate 2>/dev/null || source venv/Scripts/activate 2>/dev/null
    
    echo "Installing Python dependencies..."
    pip install -r requirements.txt
    
    echo ""
    echo "🎉 Setup complete! Starting servers..."
    echo "Backend: http://localhost:8001"
    echo "Frontend: http://localhost:3000"
    echo ""
    
    # Start both servers
    cd ../frontend
    npm run dev-python
    
elif [ "$backend_choice" = "2" ]; then
    echo "📦 Setting up Node.js Express backend..."
    if [ ! -d "node_modules" ]; then
        npm install
    else
        echo "✅ Backend dependencies already installed"
    fi
    
    echo ""
    echo "🎉 Setup complete! Starting servers..."
    echo "Backend: http://localhost:8000"
    echo "Frontend: http://localhost:3000"
    echo ""
    
    # Start both servers
    cd ../frontend
    npm run dev-node
    
else
    echo "❌ Invalid choice. Please run the script again."
    exit 1
fi

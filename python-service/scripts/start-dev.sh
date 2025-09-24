#!/bin/bash
# Development startup script

set -e

echo "Starting Docling + pandas Processing Service (Development Mode)"

# Make script executable
chmod +x "$0"

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

# Install dependencies if needed
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python -m venv venv
fi

source venv/bin/activate

# Install/upgrade dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Run with hot reload
echo "Starting service with hot reload on http://localhost:8000"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload --log-level debug
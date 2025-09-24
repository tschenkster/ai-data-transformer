#!/bin/bash
# Test script for the Python service

set -e

echo "Running tests for Docling + pandas Processing Service"

# Activate virtual environment if it exists
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Install test dependencies
pip install pytest pytest-asyncio pytest-cov httpx

# Run tests
echo "Running unit tests..."
pytest tests/ -v --cov=app --cov-report=html --cov-report=term

# Run integration tests if available
if [ -d "tests/integration" ]; then
    echo "Running integration tests..."
    pytest tests/integration/ -v
fi

echo "All tests completed!"
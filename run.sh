#!/bin/bash

# Sundarban Hat - Local Run Script
# This script starts a lightweight local web server to preview the project.

PORT=8000
DIRECTORY="/Users/mdmehedihassan/Desktop/Projects/Sundarbanhat"

echo "=================================================="
echo "🍃 Sundarban Hat (সুন্দরবন হাট) - Local Server"
echo "=================================================="
echo "Starting local preview server..."
echo "Project Directory: $DIRECTORY"

# Check if Python is installed
if command -v python3 &>/dev/null; then
    echo "Using Python 3 HTTP Server on port $PORT..."
    echo "Opening browser: http://localhost:$PORT"
    
    # Open browser automatically on mac
    if [[ "$OSTYPE" == "darwin"* ]]; then
        (sleep 1 && open "http://localhost:$PORT") &
    fi
    
    python3 -m http.server $PORT
elif command -v python &>/dev/null; then
    echo "Using Python HTTP Server on port $PORT..."
    echo "Opening browser: http://localhost:$PORT"
    
    # Open browser automatically on mac
    if [[ "$OSTYPE" == "darwin"* ]]; then
        (sleep 1 && open "http://localhost:$PORT") &
    fi
    
    python -m SimpleHTTPServer $PORT
else
    echo "❌ Error: Python is not installed on this system."
    echo "Please install Python or use another local server tool (like live-server or node-static) to run the static HTML files."
    exit 1
fi

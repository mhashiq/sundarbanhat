#!/bin/bash
#./run.sh
# Sundarban Hat - Local Run Script
# This script starts the Vite development server to preview the React project.

echo "=================================================="
echo "🍃 Sundarban Hat (সুন্দরবন হাট) - React dev Server"
echo "=================================================="
echo "Starting local Vite development server..."

# Check if node_modules exists, if not install dependencies
if [ ! -d "node_modules" ]; then
    echo "📦 node_modules not found. Installing dependencies first..."
    npm install
fi

# Run Vite dev server
npm run dev

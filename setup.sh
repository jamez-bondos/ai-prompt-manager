#!/bin/bash

# Complete setup script for AI Prompt Template Manager
# This script will set up the project from scratch

echo "Setting up AI Prompt Template Manager from scratch..."

# Create necessary directories
mkdir -p dist
mkdir -p src/main
mkdir -p src/renderer/components
mkdir -p src/renderer/services
mkdir -p src/renderer/styles

# Clean up any existing installations
if [ -d "node_modules" ]; then
  echo "Removing existing node_modules..."
  rm -rf node_modules
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Copy test templates if needed
if [ -f "test-template.json" ]; then
  echo "Setting up test templates..."
  mkdir -p "$HOME/Library/Application Support/ai-prompt-manager/templates"
  cp test-template.json "$HOME/Library/Application Support/ai-prompt-manager/templates/templates.json"
fi

# Build the application
echo "Building application..."
export NODE_ENV=development
npm run build

# Start the application
echo "Starting application..."
npm start 
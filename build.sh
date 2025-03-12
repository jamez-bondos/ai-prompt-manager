#!/bin/bash

# Build and run the AI Prompt Template Manager

echo "Building AI Prompt Template Manager..."

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  npm install
fi

# Build the application
echo "Building application..."
npm run build

# Start the application
echo "Starting application..."
npm start 
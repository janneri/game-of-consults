#!/bin/bash
# Start script for Game of Consults

echo "Building TypeScript..."
npm run build

echo "Starting server on port 3000..."
npm start

echo "Open http://localhost:3000 in your browser to view the game!"


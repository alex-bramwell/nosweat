#!/bin/bash
# Docker Setup Script
# Regenerates package-lock.json and starts Docker services

echo "🔧 Setting up Docker environment..."

# Step 1: Install dependencies locally (updates package-lock.json)
echo ""
echo "📦 Installing dependencies and updating package-lock.json..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed. Please check for errors above."
    exit 1
fi

# Step 2: Commit the updated lock file
echo ""
echo "💾 Committing updated package-lock.json..."
git add package-lock.json
git commit -m "chore: update package-lock.json for Express dependencies"

# Step 3: Start Docker services
echo ""
echo "🐳 Starting Docker services..."
docker-compose up --build

echo ""
echo "✅ Docker setup complete!"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"

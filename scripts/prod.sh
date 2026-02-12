#!/usr/bin/env bash
# Start production environment with Docker
echo "🚀 Starting production environment..."
docker-compose -f docker-compose.prod.yml up --build

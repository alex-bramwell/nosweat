#!/usr/bin/env bash
# Stop all Docker services
echo "🛑 Stopping Docker services..."
docker-compose down
docker-compose -f docker-compose.prod.yml down
echo "✅ All services stopped"

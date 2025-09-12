#!/bin/bash

echo "🚀 Starting deployment process..."

# Check if .env.prod exists
if [ ! -f ".env.prod" ]; then
    echo "❌ .env.prod file not found!"
    echo "Please copy .env.prod.example to .env.prod and fill in your values"
    exit 1
fi

# Load environment variables
set -a
source .env.prod
set +a

# Build and start services
echo "📦 Building Docker images..."
docker-compose -f docker-compose.prod.yml build

echo "🗄️ Starting database..."
docker-compose -f docker-compose.prod.yml up -d db

echo "⏳ Waiting for database to be ready..."
sleep 10

echo "🔄 Running database migrations..."
cd server
npx prisma migrate deploy
cd ..

echo "🚀 Starting all services..."
docker-compose -f docker-compose.prod.yml up -d

echo "✅ Deployment complete!"
echo "📊 Dashboard: http://localhost"
echo "🔗 API Server: http://localhost:9090"
echo "🗄️ Database: localhost:5432"

echo ""
echo "📋 To check logs:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🛑 To stop services:"
echo "  docker-compose -f docker-compose.prod.yml down"

#!/bin/bash
# GAR Deployment Script
# Usage: ./deploy.sh

set -e

echo "=== GAR Deployment ==="
echo ""

cd /root/GAR

echo "[1/4] Building Docker image..."
docker compose build gar-app

echo ""
echo "[2/4] Stopping old container..."
docker compose stop gar-app

echo ""
echo "[3/4] Starting new container..."
docker compose up -d gar-app

echo ""
echo "[4/4] Verifying deployment..."
sleep 3

RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -H "Host: agentirol.sbs" http://localhost)

if [ "$RESPONSE" = "200" ]; then
    echo ""
    echo "=== Deployment successful! ==="
    echo "App GAR: https://agentirol.sbs"
else
    echo ""
    echo "=== Warning: HTTP $RESPONSE - check manually ==="
fi

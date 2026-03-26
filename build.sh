#!/bin/bash

# Script di build per GAR (Gestione Agenti Roloil)
# Questo script automatizza il processo di build e deployment Docker

set -e  # Esce in caso di errore

echo "🚀 Avvio build GAR - Gestione Agenti Roloil"
echo "=========================================="

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funzione per logging
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Verifica prerequisiti
log "Verifica prerequisiti..."

if ! command -v docker &> /dev/null; then
    error "Docker non è installato. Installare Docker prima di continuare."
fi

if ! command -v docker-compose &> /dev/null; then
    warning "docker-compose non trovato, provo con 'docker compose'"
    DOCKER_COMPOSE="docker compose"
else
    DOCKER_COMPOSE="docker-compose"
fi

# Verifica file necessari
if [ ! -f "package.json" ]; then
    error "File package.json non trovato. Eseguire lo script dalla root del progetto."
fi

if [ ! -f "Dockerfile" ]; then
    error "Dockerfile non trovato."
fi

# Pulizia build precedenti
log "Pulizia build precedenti..."
docker system prune -f --volumes || warning "Errore durante la pulizia, continuo..."

# Build dell'immagine Docker
log "Build dell'immagine Docker..."
IMAGE_NAME="gar-app"
IMAGE_TAG="latest"

docker build -t ${IMAGE_NAME}:${IMAGE_TAG} . || error "Errore durante la build Docker"

success "Immagine Docker creata: ${IMAGE_NAME}:${IMAGE_TAG}"

# Verifica dimensione immagine
IMAGE_SIZE=$(docker images ${IMAGE_NAME}:${IMAGE_TAG} --format "table {{.Size}}" | tail -n 1)
log "Dimensione immagine: ${IMAGE_SIZE}"

# Opzioni per il deployment
echo ""
echo "Opzioni disponibili:"
echo "1. Avvia con docker-compose (raccomandato)"
echo "2. Avvia container singolo"
echo "3. Solo build (non avviare)"
echo "4. Build e push su registry"

read -p "Seleziona un'opzione (1-4): " choice

case $choice in
    1)
        log "Avvio con docker-compose..."
        $DOCKER_COMPOSE down || true
        $DOCKER_COMPOSE up -d
        success "Applicazione avviata su http://localhost:8090"
        log "Per vedere i logs: $DOCKER_COMPOSE logs -f"
        ;;
    2)
        log "Avvio container singolo..."
        docker stop gar-container 2>/dev/null || true
        docker rm gar-container 2>/dev/null || true
        docker run -d \
            --name gar-container \
            -p 8090:80 \
            --env-file .env.production \
            ${IMAGE_NAME}:${IMAGE_TAG}
        success "Container avviato su http://localhost:8090"
        log "Per vedere i logs: docker logs -f gar-container"
        ;;
    3)
        success "Build completata. Immagine pronta per il deployment."
        ;;
    4)
        read -p "Inserisci il registry URL (es. your-registry.com/gar): " registry
        if [ -n "$registry" ]; then
            log "Tag e push su registry..."
            docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${registry}:${IMAGE_TAG}
            docker push ${registry}:${IMAGE_TAG}
            success "Immagine pushata su ${registry}:${IMAGE_TAG}"
        else
            warning "Registry URL non fornito, skip push."
        fi
        ;;
    *)
        warning "Opzione non valida. Build completata senza deployment."
        ;;
esac

echo ""
success "🎉 Build completata con successo!"
echo ""
echo "Comandi utili:"
echo "- Vedere logs: $DOCKER_COMPOSE logs -f"
echo "- Fermare: $DOCKER_COMPOSE down"
echo "- Riavviare: $DOCKER_COMPOSE restart"
echo "- Health check: curl http://localhost/health"
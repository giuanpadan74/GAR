#!/bin/bash

# Script di backup per il progetto Gestione Agenti Roloil
# Esclude librerie, build e file temporanei

# Configurazione
PROJECT_NAME="gestione-agenti-roloil"
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${PROJECT_NAME}_backup_${TIMESTAMP}"

# Colori per output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🔄 Avvio backup del progetto...${NC}"

# Crea directory backup se non esiste
mkdir -p "$BACKUP_DIR"

# Definisci file e directory da escludere
EXCLUDE_PATTERNS=(
    # Node.js e dipendenze
    "node_modules"
    "node_modules/*"
    
    # Build e distribuzione
    "dist"
    "dist/*"
    "build"
    "build/*"
    
    # File di configurazione locale
    ".env"
    ".env.local"
    ".env.*.local"
    "*.log"
    "npm-debug.log*"
    "yarn-debug.log*"
    "yarn-error.log*"
    
    # Cache e temporanei
    ".cache"
    ".cache/*"
    ".temp"
    ".temp/*"
    "*.tmp"
    "*.temp"
    
    # IDE e editor
    ".vscode"
    ".vscode/*"
    ".idea"
    ".idea/*"
    "*.swp"
    "*.swo"
    "*~"
    
    # Sistema operativo
    ".DS_Store"
    "Thumbs.db"
    "desktop.ini"
    
    # Git
    ".git"
    ".git/*"
    
    # Backup esistenti
    "backups"
    "backups/*"
    "*.tar.gz"
    "*.zip"
    
    # Test coverage
    "coverage"
    "coverage/*"
    
    # Vite e strumenti di sviluppo
    ".vite"
    ".vite/*"
)

# Crea file di esclusione temporaneo
EXCLUDE_FILE=$(mktemp)
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    echo "$pattern" >> "$EXCLUDE_FILE"
done

echo -e "${YELLOW}📦 Creazione archivio backup...${NC}"

# Crea il backup usando tar
tar -czf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" \
    --exclude-from="$EXCLUDE_FILE" \
    --exclude-vcs \
    --exclude-backups \
    .

# Verifica se il backup è stato creato con successo
if [ $? -eq 0 ]; then
    # Calcola dimensione del backup
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)
    
    echo -e "${GREEN}✅ Backup completato con successo!${NC}"
    echo -e "${GREEN}📁 File backup: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz${NC}"
    echo -e "${GREEN}📊 Dimensione: $BACKUP_SIZE${NC}"
    
    # Lista dei contenuti del backup
    echo -e "${YELLOW}📋 Contenuto del backup:${NC}"
    tar -tzf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | head -20
    
    # Conta file totali nel backup
    FILE_COUNT=$(tar -tzf "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | wc -l)
    echo -e "${GREEN}📈 File inclusi nel backup: $FILE_COUNT${NC}"
    
else
    echo -e "${RED}❌ Errore durante la creazione del backup!${NC}"
    exit 1
fi

# Pulizia: rimuovi file di esclusione temporaneo
rm -f "$EXCLUDE_FILE"

# Opzionale: mantieni solo gli ultimi N backup
KEEP_BACKUPS=5
echo -e "${YELLOW}🧹 Pulizia backup vecchi...${NC}"

# Rimuovi backup più vecchi, mantenendo solo gli ultimi N
if [ -d "$BACKUP_DIR" ]; then
    ls -t "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs rm -f
    
    REMAINING_BACKUPS=$(ls -1 "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | wc -l)
    echo -e "${GREEN}🗑️  Backup vecchi rimossi. Backup rimanenti: $REMAINING_BACKUPS${NC}"
fi

echo -e "${GREEN}🎉 Processo di backup completato!${NC}"
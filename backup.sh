#!/bin/bash

# Script di backup per il progetto Gestione Agenti Roloil
# Esclude librerie, build e file temporanei

# Configurazione
PROJECT_NAME="GAR"
BACKUP_DIR="/root/GARbackup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="${PROJECT_NAME}_backup_${TIMESTAMP}.zip"

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
    ".trae"
    ".trae/*"
    ".gemini"
    ".gemini/*"
)

# Crea file di esclusione temporaneo
EXCLUDE_FILE=$(mktemp)
for pattern in "${EXCLUDE_PATTERNS[@]}"; do
    echo "$pattern" >> "$EXCLUDE_FILE"
done

echo -e "${YELLOW}📦 Creazione archivio ZIP...${NC}"

# Creiamo l'elenco dei file da includere (escludendo quelli nel pattern)
# Usiamo python3 per creare uno ZIP dato che 'zip' non è installato
python3 -c "
import os, zipfile, fnmatch

# Carica pattern di esclusione
excludes = []
with open('$EXCLUDE_FILE', 'r') as f:
    excludes = [line.strip() for line in f if line.strip()]

def is_excluded(path):
    for pattern in excludes:
        # Se il pattern termina con /*, controlliamo se il path inizia con la directory base
        if pattern.endswith('/*'):
            base = pattern[:-2]
            if path == base or path.startswith(base + os.sep):
                return True
        # Match standard glob
        if fnmatch.fnmatch(path, pattern) or any(fnmatch.fnmatch(part, pattern) for part in path.split(os.sep)):
            return True
    return False

with zipfile.ZipFile('${BACKUP_DIR}/${BACKUP_NAME}', 'w', zipfile.ZIP_DEFLATED) as zipf:
    for root, dirs, files in os.walk('.'):
        # Rimuovi cartelle escluse da os.walk per non percorrerle inutilmente
        dirs_to_keep = []
        for d in dirs:
            rel_path = os.path.relpath(os.path.join(root, d), '.')
            if not is_excluded(rel_path):
                dirs_to_keep.append(d)
        dirs[:] = dirs_to_keep
        
        for file in files:
            rel_path = os.path.relpath(os.path.join(root, file), '.')
            if not is_excluded(rel_path):
                zipf.write(rel_path)
"

# Verifica se il backup è stato creato con successo
if [ $? -eq 0 ]; then
    # Calcola dimensione del backup
    BACKUP_SIZE=$(du -h "${BACKUP_DIR}/${BACKUP_NAME}" | cut -f1)
    
    echo -e "${GREEN}✅ Backup completato con successo!${NC}"
    echo -e "${GREEN}📁 File backup: ${BACKUP_DIR}/${BACKUP_NAME}${NC}"
    echo -e "${GREEN}📊 Dimensione: $BACKUP_SIZE${NC}"
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
    ls -t "${BACKUP_DIR}"/*.zip 2>/dev/null | tail -n +$((KEEP_BACKUPS + 1)) | xargs rm -f
    
    REMAINING_BACKUPS=$(ls -1 "${BACKUP_DIR}"/*.zip 2>/dev/null | wc -l)
    echo -e "${GREEN}🗑️  Backup vecchi rimossi. Backup rimanenti: $REMAINING_BACKUPS${NC}"
fi

echo -e "${GREEN}🎉 Processo di backup completato!${NC}"
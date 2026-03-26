#!/bin/bash

# Script per configurare il dominio agentirol.sbs
# Questo script attiva il proxy nginx per gestire il dominio

echo "🚀 Configurazione dominio agentirol.sbs"
echo "========================================"

# Verifica se Docker è in esecuzione
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker non è in esecuzione. Avvia Docker prima di continuare."
    exit 1
fi

echo "📋 Stato attuale dei container:"
docker-compose ps

echo ""
echo "🔧 Attivazione del proxy nginx per agentirol.sbs..."

# Ferma i container esistenti se in esecuzione
echo "⏹️  Fermando container esistenti..."
docker-compose down

# Avvia i container con il profilo proxy
echo "🚀 Avviando container con proxy nginx..."
docker-compose --profile proxy up -d

echo ""
echo "📊 Verifica stato dei container:"
docker-compose --profile proxy ps

echo ""
echo "🔍 Test di connettività:"
echo "- Container gar-app: http://localhost:8090"
echo "- Proxy nginx: http://localhost:80"

# Test di connettività
echo ""
echo "🧪 Test automatici:"
if curl -s http://localhost:8090/health > /dev/null; then
    echo "✅ gar-app risponde correttamente"
else
    echo "❌ gar-app non risponde"
fi

if curl -s http://localhost:80/health > /dev/null; then
    echo "✅ nginx-proxy risponde correttamente"
else
    echo "❌ nginx-proxy non risponde"
fi

echo ""
echo "📝 ISTRUZIONI DNS DYNADOT:"
echo "=========================="
echo "1. Accedi al pannello Dynadot"
echo "2. Vai su 'Impostazioni DNS' per agentirol.sbs"
echo "3. RIMUOVI il record CNAME con 'https://example.example.com'"
echo "4. Mantieni solo questi record:"
echo "   - Record A: agentirol.sbs → 94.130.14.32"
echo "   - Record A: www.agentirol.sbs → 94.130.14.32"
echo "5. Salva le impostazioni"
echo ""
echo "⏰ La propagazione DNS può richiedere 5-48 ore"
echo ""
echo "🎯 Dopo la propagazione DNS:"
echo "- http://agentirol.sbs → funzionerà"
echo "- http://www.agentirol.sbs → funzionerà"
echo ""
echo "🔧 Per disattivare il proxy:"
echo "docker-compose down && docker-compose up -d"
echo ""
echo "✅ Configurazione completata!"
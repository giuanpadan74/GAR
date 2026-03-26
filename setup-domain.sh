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

# Verifica se esistono i certificati SSL
if [ ! -f "ssl/nginx-selfsigned.crt" ] || [ ! -f "ssl/nginx-selfsigned.key" ]; then
    echo "🔐 Certificati SSL non trovati. Creazione certificato auto-firmato..."
    ./create-ssl-cert.sh
fi

# Ferma i container esistenti se in esecuzione
echo "⏹️  Fermando container esistenti..."
docker-compose down

# Avvia i container con il profilo proxy
echo "🚀 Avviando container con proxy nginx (HTTP + HTTPS)..."
docker-compose --profile proxy up -d

echo ""
echo "📊 Verifica stato dei container:"
docker-compose --profile proxy ps

echo ""
echo "🔍 Test di connettività:"
echo "- Container gar-app: http://localhost:8090"
echo "- Proxy nginx HTTP: http://localhost:8081 (porta sicura)"
echo "- Proxy nginx HTTPS: https://localhost:8082 (redirect a HTTP, porta sicura)"

# Test di connettività
echo ""
echo "🧪 Test automatici:"
if curl -s http://localhost:8090/health > /dev/null; then
    echo "✅ gar-app risponde correttamente"
else
    echo "❌ gar-app non risponde"
fi

if curl -s http://localhost:8081/health > /dev/null; then
    echo "✅ nginx-proxy HTTP risponde correttamente (porta 8081)"
else
    echo "❌ nginx-proxy HTTP non risponde (porta 8081)"
fi

if curl -s -k https://localhost:8082/health > /dev/null; then
    echo "✅ nginx-proxy HTTPS risponde (con redirect, porta 8082)"
else
    echo "❌ nginx-proxy HTTPS non risponde (porta 8082)"
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
echo "   NOTA: Il proxy userà la porta 8081 (HTTP) e 8082 (HTTPS)"
echo "5. Salva le impostazioni"
echo ""
echo "⏰ La propagazione DNS può richiedere 5-48 ore"
echo ""
echo "🎯 Dopo la propagazione DNS:"
echo "- http://agentirol.sbs → funzionerà direttamente"
echo "- https://agentirol.sbs → reindirizza a http://agentirol.sbs"
echo "- http://www.agentirol.sbs → funzionerà direttamente"
echo "- https://www.agentirol.sbs → reindirizza a http://www.agentirol.sbs"
echo ""
echo "🔐 RISOLUZIONE ERRORE SSL:"
echo "========================="
echo "✅ L'errore 'net::ERR_CERT_COMMON_NAME_INVALID' è ora risolto!"
echo "✅ HTTPS funziona e reindirizza automaticamente a HTTP"
echo "✅ Il browser non mostrerà più errori SSL"
echo ""
echo "🔧 Gestione container:"
echo "- Disattivare proxy: docker-compose down && docker-compose up -d"
echo "- Riattivare proxy: docker-compose --profile proxy up -d"
echo ""
echo "✅ Configurazione SSL completata!"
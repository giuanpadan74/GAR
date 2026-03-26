#!/bin/bash

# Script per creare certificato SSL auto-firmato temporaneo
# Questo risolve l'errore SSL permettendo il redirect HTTPS → HTTP

echo "🔐 Creazione certificato SSL auto-firmato per agentirol.sbs"
echo "=========================================================="

# Crea directory per certificati SSL
mkdir -p ssl

# Genera certificato auto-firmato
echo "📝 Generazione certificato SSL auto-firmato..."
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/nginx-selfsigned.key \
    -out ssl/nginx-selfsigned.crt \
    -subj "/C=IT/ST=Italy/L=Rome/O=GAR/OU=IT Department/CN=agentirol.sbs/emailAddress=admin@agentirol.sbs" \
    -addext "subjectAltName=DNS:agentirol.sbs,DNS:www.agentirol.sbs"

if [ $? -eq 0 ]; then
    echo "✅ Certificato SSL auto-firmato creato con successo!"
    echo ""
    echo "📁 File creati:"
    echo "- ssl/nginx-selfsigned.crt (certificato)"
    echo "- ssl/nginx-selfsigned.key (chiave privata)"
    echo ""
    echo "⚠️  IMPORTANTE:"
    echo "Questo è un certificato auto-firmato temporaneo."
    echo "Il browser mostrerà un avviso di sicurezza, ma il redirect funzionerà."
    echo ""
    echo "🔄 Per applicare le modifiche:"
    echo "docker-compose --profile proxy down"
    echo "docker-compose --profile proxy up -d"
else
    echo "❌ Errore nella creazione del certificato SSL"
    exit 1
fi
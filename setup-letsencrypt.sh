#!/bin/bash

# Script per configurare Let's Encrypt SSL per agentirol.sbs
# ATTENZIONE: Eseguire solo dopo che il dominio è raggiungibile via HTTP

echo "🔐 Configurazione Let's Encrypt SSL per agentirol.sbs"
echo "===================================================="

# Verifica prerequisiti
echo "📋 Verifica prerequisiti..."

# 1. Verifica che il dominio sia raggiungibile
echo "🌐 Test raggiungibilità dominio..."
if ! curl -s -I http://agentirol.sbs/health > /dev/null; then
    echo "❌ ERRORE: Il dominio agentirol.sbs non è raggiungibile via HTTP"
    echo "   Prima di configurare SSL, assicurati che:"
    echo "   1. I record DNS siano propagati"
    echo "   2. Il proxy nginx sia attivo"
    echo "   3. Il dominio risponda su HTTP"
    exit 1
fi

echo "✅ Dominio raggiungibile via HTTP"

# 2. Installa certbot se non presente
if ! command -v certbot &> /dev/null; then
    echo "📦 Installazione Certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# 3. Ferma il proxy per permettere a certbot di usare la porta 80
echo "⏹️  Fermando proxy nginx temporaneamente..."
docker-compose --profile proxy down

# 4. Ottieni certificato Let's Encrypt
echo "🔐 Ottenimento certificato Let's Encrypt..."
sudo certbot certonly --standalone \
    --email admin@agentirol.sbs \
    --agree-tos \
    --no-eff-email \
    -d agentirol.sbs \
    -d www.agentirol.sbs

if [ $? -eq 0 ]; then
    echo "✅ Certificato Let's Encrypt ottenuto con successo!"
    
    # 5. Copia i certificati nella directory ssl
    echo "📁 Copia certificati nella directory ssl..."
    sudo cp /etc/letsencrypt/live/agentirol.sbs/fullchain.pem ssl/letsencrypt-fullchain.pem
    sudo cp /etc/letsencrypt/live/agentirol.sbs/privkey.pem ssl/letsencrypt-privkey.pem
    sudo chown $(whoami):$(whoami) ssl/letsencrypt-*.pem
    
    # 6. Crea configurazione nginx con SSL reale
    echo "🔧 Creazione configurazione nginx con SSL Let's Encrypt..."
    cp nginx-proxy.conf nginx-proxy-ssl.conf
    
    # Sostituisce i certificati auto-firmati con quelli di Let's Encrypt
    sed -i 's|ssl_certificate /etc/nginx/ssl/nginx-selfsigned.crt;|ssl_certificate /etc/nginx/ssl/letsencrypt-fullchain.pem;|' nginx-proxy-ssl.conf
    sed -i 's|ssl_certificate_key /etc/nginx/ssl/nginx-selfsigned.key;|ssl_certificate_key /etc/nginx/ssl/letsencrypt-privkey.pem;|' nginx-proxy-ssl.conf
    
    # Rimuove il redirect HTTPS → HTTP e abilita il proxy HTTPS
    sed -i 's|# Redirect HTTPS a HTTP (soluzione temporanea)|# Proxy HTTPS verso applicazione|' nginx-proxy-ssl.conf
    sed -i 's|return 301 http://$server_name$request_uri;|location / {\
            proxy_pass http://gar-app:80;\
            proxy_set_header Host $host;\
            proxy_set_header X-Real-IP $remote_addr;\
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;\
            proxy_set_header X-Forwarded-Proto $scheme;\
            \
            proxy_connect_timeout 60s;\
            proxy_send_timeout 60s;\
            proxy_read_timeout 60s;\
            \
            proxy_buffering on;\
            proxy_buffer_size 4k;\
            proxy_buffers 8 4k;\
        }|' nginx-proxy-ssl.conf
    
    echo ""
    echo "✅ Configurazione Let's Encrypt completata!"
    echo ""
    echo "🔄 Per attivare SSL reale:"
    echo "1. cp nginx-proxy-ssl.conf nginx-proxy.conf"
    echo "2. docker-compose --profile proxy up -d"
    echo ""
    echo "🔄 Per tornare al redirect temporaneo:"
    echo "1. git checkout nginx-proxy.conf"
    echo "2. docker-compose --profile proxy up -d"
    
else
    echo "❌ Errore nell'ottenimento del certificato Let's Encrypt"
    echo "   Verifica che:"
    echo "   1. Il dominio sia correttamente configurato"
    echo "   2. La porta 80 sia libera"
    echo "   3. Non ci siano firewall che bloccano la connessione"
fi

# 7. Riavvia il proxy con la configurazione attuale
echo "🚀 Riavvio proxy nginx..."
docker-compose --profile proxy up -d

echo ""
echo "📝 NOTA IMPORTANTE:"
echo "=================="
echo "Il certificato Let's Encrypt deve essere rinnovato ogni 90 giorni."
echo "Configura un cron job per il rinnovo automatico:"
echo "0 12 * * * /usr/bin/certbot renew --quiet"
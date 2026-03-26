# Multi-stage build per ottimizzare le dimensioni dell'immagine finale

# Stage 1: Build dell'applicazione
FROM node:20-alpine AS builder

# Imposta la directory di lavoro
WORKDIR /app

# Copia i file di configurazione delle dipendenze
COPY package*.json ./

# Installa tutte le dipendenze (incluse devDependencies per la build)
RUN npm ci --silent

# Copia tutto il codice sorgente
COPY . .

# Crea la build di produzione
RUN npm run build

# Stage 2: Nginx per servire l'applicazione
FROM nginx:alpine AS production

# Copia la configurazione personalizzata di Nginx
COPY nginx.conf /etc/nginx/nginx.conf

# Copia i file buildati dal stage precedente
COPY --from=builder /app/dist /usr/share/nginx/html

# Copia i file di dati statici se necessari
COPY --from=builder /app/public/data /usr/share/nginx/html/data

# Espone la porta 80
EXPOSE 80

# Comando per avviare Nginx
CMD ["nginx", "-g", "daemon off;"]

# Metadata dell'immagine
LABEL maintainer="GAR Team"
LABEL description="Gestione Agenti Roloil - React/Vite Application"
LABEL version="1.0.0"

# Health check per verificare che l'applicazione sia in esecuzione
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1
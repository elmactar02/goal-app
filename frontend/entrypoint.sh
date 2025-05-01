#!/bin/sh

# Ce fichier sera exécuté AVANT nginx, à chaque démarrage du conteneur

echo "window._env_ = {" > /usr/share/nginx/html/env-config.js
echo "  BACKEND_URL: \"${REACT_APP_BACKEND_URL}\"" >> /usr/share/nginx/html/env-config.js
echo "};" >> /usr/share/nginx/html/env-config.js

echo "✅ env-config.js generated with BACKEND_URL=$REACT_APP_BACKEND_URL"

# Lancer nginx ensuite
nginx -g "daemon off;"

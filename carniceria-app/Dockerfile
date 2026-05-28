# Etapa 2: Servidor Web Nginx
FROM nginx:alpine

# Borramos la página de bienvenida por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiamos el archivo de configuración que acabas de crear
COPY nginx.conf /etc/nginx/conf.d/default.conf

# IMPORTANTE: Revisa en tu computadora la carpeta 'dist'
# Si tu index.html se guarda en dist/carniceria-app/browser, usa esta línea:
COPY --from=build /app/dist/carniceria-app/browser /usr/share/nginx/html

# Si tu index.html se guarda directo en dist/carniceria-app, usa esta otra (borra la de arriba):
# COPY --from=build /app/dist/carniceria-app /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
# Etapa 1: Compilación de Angular
FROM node:22 AS build
WORKDIR /app

# Copiar package.json e instalar dependencias
COPY package*.json ./
RUN npm install

# Copiar todo el código de Angular y compilar
COPY . .
RUN npm run build --configuration=production

# Etapa 2: Servidor Web Nginx
FROM nginx:alpine

# Borramos la página de bienvenida por defecto de Nginx
RUN rm -rf /usr/share/nginx/html/*

# Copiamos el archivo de configuración de rutas
COPY nginx.conf /etc/nginx/conf.d/default.conf

# LA RUTA CORRECTA: Usando carniceria-app
COPY --from=build /app/dist/carniceria-app/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
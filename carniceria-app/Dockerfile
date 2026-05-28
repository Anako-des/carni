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
# Copiamos los archivos compilados de Angular al servidor Nginx
# Nota: Verifica si tu Angular genera la carpeta 'browser' dentro de 'dist/carniceria-app'
COPY --from=build /app/dist/carniceria-app/browser /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
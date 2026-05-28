# Usamos una versión ligera de Python
FROM python:3.10-slim

# Directorio de trabajo en el contenedor
WORKDIR /app

# Copiamos solo el archivo de requerimientos primero
COPY requirements.txt .

# Instalamos Flask y el conector de MySQL
RUN pip install --no-cache-dir -r requirements.txt

# Copiamos el resto del código del Backend (app.py, config.py)
COPY . .

# Exponemos el puerto de Flask
EXPOSE 5000

# Comando para iniciar la API
CMD ["python", "app.py"]
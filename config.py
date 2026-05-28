import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host="db-server",       # ¡Clave! Este es el nombre del contenedor de la BD en docker-compose
        port=3306,              # Puerto interno por defecto de MySQL en Docker
        user="root",            # El usuario que definiste en docker-compose (suele ser root)
        password="rootpassword",# La contraseña de tu docker-compose
        database="pag_carni", # O el nombre exacto de la BD en tu docker-compose
        charset="utf8mb4"
    )
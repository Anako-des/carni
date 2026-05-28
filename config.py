import mysql.connector

def get_connection():
    return mysql.connector.connect(
        host="localhost",
        port=3307,
        user="alon",
        password="123456789",
        database="pag_carni",
        charset="utf8mb4"
    )
    
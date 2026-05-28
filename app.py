# app.py
# pip install flask mysql-connector-python
from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql
from config import get_connection
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
#CORS(app, resources={r"/*": {"origins": "http://34.151.214.143:4200"}}, supports_credentials=True)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

# ════════════════════════════════════════
#  CATEGORÍAS  (tabla: categoria)
# ════════════════════════════════════════
@app.route('/categorias', methods=['GET'])
def obtener_categorias():
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id_categoria, nombre FROM categoria ORDER BY nombre")
    result = cursor.fetchall()
    conn.close()
    return jsonify(result)


@app.route('/categorias', methods=['POST'])
def crear_categoria():
    """
    Body JSON: { "nombre": "Borrego" }
    """
    data   = request.get_json()
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO categoria (nombre) VALUES (%s)", (data['nombre'],))
    nuevo_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'mensaje': 'Categoría creada', 'id_categoria': nuevo_id}), 201


# ═══════════════════════════════════════════════════════════════
#  PRODUCTOS  (tabla: producfo | columnas: nam, prec, imagn)
# ═══════════════════════════════════════════════════════════════

@app.route('/productos', methods=['GET'])
def obtener_productos():
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id_produc, c.nombre AS categoria, p.nam AS nombre,
               p.prec AS precio, p.imagn AS imagen
        FROM   producfo p
        JOIN   categoria c ON c.id_categoria = p.id_categoria
        ORDER  BY c.nombre, p.nam
    """)
    result = cursor.fetchall()
    conn.close()
    return jsonify(result)


@app.route('/productos/<int:id_produc>', methods=['GET'])
def obtener_producto(id_produc):
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id_produc, c.nombre AS categoria, p.nam AS nombre,
               p.prec AS precio, p.imagn AS imagen
        FROM   producfo p
        JOIN   categoria c ON c.id_categoria = p.id_categoria
        WHERE  p.id_produc = %s
    """, (id_produc,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return jsonify(row)
    return jsonify({'mensaje': 'Producto no encontrado'}), 404


@app.route('/productos', methods=['POST'])
def crear_producto():
    """
    Body JSON:
      { "id_categoria": 1, "nam": "Pechuga", "prec": 130.00,
        "imagn": "...", "stock": 20, "stock_minimo": 5 }
    """
    data   = request.get_json()
    conn   = get_connection()
    cursor = conn.cursor()

    cursor.execute("""
        INSERT INTO producfo (nam, prec, imagn, id_categoria)
        VALUES (%s, %s, %s, %s)
    """, (data['nam'], data['prec'], data.get('imagn'), data['id_categoria']))
    nuevo_id = cursor.lastrowid

    cursor.execute("""
        INSERT INTO inventaro (id_produc, stock, stock_minimo)
        VALUES (%s, %s, %s)
    """, (nuevo_id, data.get('stock', 0), data.get('stock_minimo', 5)))

    if data.get('stock', 0) > 0:
        cursor.execute("""
            INSERT INTO movimiento (id_produc, tipo, cantidad)
            VALUES (%s, 'entrada', %s)
        """, (nuevo_id, data['stock']))

    conn.commit()
    conn.close()
    return jsonify({'mensaje': 'Producto creado', 'id_produc': nuevo_id}), 201


@app.route('/productos/<int:id_produc>', methods=['PUT'])
def actualizar_producto(id_produc):
    """
    Body JSON: { "nam": "Pechuga premium", "prec": 150.00, "imagn": "..." }
    """
    data   = request.get_json()
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE producfo
        SET    nam = %s, prec = %s, imagn = %s
        WHERE  id_produc = %s
    """, (data['nam'], data['prec'], data.get('imagn'), id_produc))
    conn.commit()
    conn.close()
    return jsonify({'mensaje': 'Producto actualizado'})


@app.route('/productos/<int:id_produc>', methods=['DELETE'])
def eliminar_producto(id_produc):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM producfo WHERE id_produc = %s", (id_produc,))
    conn.commit()
    conn.close()
    return jsonify({'mensaje': 'Producto eliminado'})


# ═══════════════════════════════════════════════════════════════
#  INVENTARIO  (tabla: inventaro | FK: id_produc)
# ═══════════════════════════════════════════════════════════════

@app.route('/inventario', methods=['GET'])
def obtener_inventario():
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id_produc, c.nombre AS categoria, p.nam AS nombre,
               i.stock, i.stock_minimo,
               IF(i.stock < i.stock_minimo, 'BAJO', 'OK') AS estado_stock
        FROM   inventaro i
        JOIN   producfo  p ON p.id_produc    = i.id_produc
        JOIN   categoria c ON c.id_categoria = p.id_categoria
        ORDER  BY estado_stock DESC, i.stock ASC
    """)
    result = cursor.fetchall()
    conn.close()
    return jsonify(result)


@app.route('/inventario/bajo-stock', methods=['GET'])
def bajo_stock():
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT p.id_produc, p.nam AS nombre, i.stock, i.stock_minimo
        FROM   inventaro i
        JOIN   producfo  p ON p.id_produc = i.id_produc
        WHERE  i.stock < i.stock_minimo
        ORDER  BY i.stock ASC
    """)
    result = cursor.fetchall()
    conn.close()
    return jsonify(result)


@app.route('/inventario/<int:id_produc>', methods=['PUT'])
def actualizar_stock(id_produc):
    """
    Actualiza el stock y registra el movimiento automáticamente.
    Body JSON: { "tipo": "entrada", "cantidad": 15 }
    tipo puede ser: "entrada" o "salida"
    """
    data     = request.get_json()
    tipo     = data['tipo']
    cantidad = data['cantidad']

    conn   = get_connection()
    cursor = conn.cursor()

    if tipo == 'entrada':
        cursor.execute("""
            UPDATE inventaro SET stock = stock + %s WHERE id_produc = %s
        """, (cantidad, id_produc))
    elif tipo == 'salida':
        cursor.execute("""
            UPDATE inventaro SET stock = stock - %s WHERE id_produc = %s
        """, (cantidad, id_produc))
    else:
        conn.close()
        return jsonify({'mensaje': 'tipo debe ser entrada o salida'}), 400

    cursor.execute("""
        INSERT INTO movimiento (id_produc, tipo, cantidad)
        VALUES (%s, %s, %s)
    """, (id_produc, tipo, cantidad))

    conn.commit()
    conn.close()
    return jsonify({'mensaje': f'Stock actualizado ({tipo}: {cantidad})'})


@app.route('/inventario/<int:id_produc>/movimientos', methods=['GET'])
def movimientos_producto(id_produc):
    """Historial de movimientos de un producto específico."""
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT id_movim, tipo, cantidad, fecha
        FROM   movimiento
        WHERE  id_produc = %s
        ORDER  BY fecha DESC
    """, (id_produc,))
    result = cursor.fetchall()
    conn.close()
    return jsonify(result)


@app.route('/movimientos', methods=['GET'])
def todos_movimientos():
    """Historial completo de todos los movimientos."""
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT m.id_movim, p.nam AS producto, m.tipo, m.cantidad, m.fecha
        FROM   movimiento m
        JOIN   producfo   p ON p.id_produc = m.id_produc
        ORDER  BY m.fecha DESC
    """)
    result = cursor.fetchall()
    conn.close()
    return jsonify(result)


# ═══════════════════════════════════════════════════════════════
#  REGISTRO SEMANAL  (tabla: registro_semanal)
#  Kilos vendidos por producto cada semana + ingreso generado
# ═══════════════════════════════════════════════════════════════

@app.route('/registro-semanal', methods=['GET'])
def obtener_registros():
    """Lista todos los registros con nombre de producto y categoría."""
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT r.id_registro, p.nam AS producto, c.nombre AS categoria,
               r.semana_inicio, r.semana_fin,
               r.kilos, r.precio_kilo, r.ingreso
        FROM   registro_semanal r
        JOIN   producfo  p ON p.id_produc    = r.id_produc
        JOIN   categoria c ON c.id_categoria = p.id_categoria
        ORDER  BY r.semana_inicio DESC, p.nam
    """)
    result = cursor.fetchall()
    conn.close()
    return jsonify(result)


@app.route('/registro-semanal/semana', methods=['GET'])
def registros_por_semana():
    """
    Todos los productos de una semana + total de ingresos.
    Uso: GET /registro-semanal/semana?inicio=2025-01-06
    """
    inicio = request.args.get('inicio')
    if not inicio:
        return jsonify({'mensaje': 'Falta el parámetro ?inicio=YYYY-MM-DD'}), 400

    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute("""
        SELECT r.id_registro, p.nam AS producto,
               r.kilos, r.precio_kilo, r.ingreso,
               r.semana_inicio, r.semana_fin
        FROM   registro_semanal r
        JOIN   producfo p ON p.id_produc = r.id_produc
        WHERE  r.semana_inicio = %s
        ORDER  BY p.nam
    """, (inicio,))
    registros = cursor.fetchall()

    cursor.execute("""
        SELECT IFNULL(SUM(ingreso), 0) AS total_ingresos
        FROM   registro_semanal
        WHERE  semana_inicio = %s
    """, (inicio,))
    total = cursor.fetchone()

    conn.close()
    return jsonify({
        'semana_inicio' : inicio,
        'registros'     : registros,
        'total_ingresos': float(total['total_ingresos'])
    })


@app.route('/registro-semanal/resumen', methods=['GET'])
def resumen_semanal():
    """
    Ingresos totales agrupados por semana para ver la evolución.
    """
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("""
        SELECT semana_inicio, semana_fin,
               SUM(kilos)   AS total_kilos,
               SUM(ingreso) AS total_ingresos
        FROM   registro_semanal
        GROUP  BY semana_inicio, semana_fin
        ORDER  BY semana_inicio DESC
    """)
    result = cursor.fetchall()
    conn.close()
    return jsonify(result)


@app.route('/registro-semanal', methods=['POST'])
def crear_registro():
    """
    Registra los kilos vendidos de un producto en una semana.
    Body JSON:
      { "id_produc": 2, "semana_inicio": "2025-01-06",
        "semana_fin": "2025-01-12", "kilos": 18.5, "precio_kilo": 130.00 }
    El ingreso se calcula solo (kilos x precio_kilo).
    """
    data   = request.get_json()
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO registro_semanal (id_produc, semana_inicio, semana_fin, kilos, precio_kilo)
        VALUES (%s, %s, %s, %s, %s)
    """, (data['id_produc'], data['semana_inicio'], data['semana_fin'],
          data['kilos'], data['precio_kilo']))
    nuevo_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return jsonify({'mensaje': 'Registro creado', 'id_registro': nuevo_id}), 201


@app.route('/registro-semanal/<int:id_registro>', methods=['PUT'])
def actualizar_registro(id_registro):
    """
    Corrige kilos o precio de un registro ya guardado.
    Body JSON: { "kilos": 20.0, "precio_kilo": 135.00 }
    """
    data   = request.get_json()
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE registro_semanal
        SET    kilos = %s, precio_kilo = %s
        WHERE  id_registro = %s
    """, (data['kilos'], data['precio_kilo'], id_registro))
    conn.commit()
    conn.close()
    return jsonify({'mensaje': 'Registro actualizado'})


@app.route('/registro-semanal/<int:id_registro>', methods=['DELETE'])
def eliminar_registro(id_registro):
    conn   = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM registro_semanal WHERE id_registro = %s", (id_registro,))
    conn.commit()
    conn.close()
    return jsonify({'mensaje': 'Registro eliminado'})


# ═══════════════════════════════════════════════════════════════
#  USUARIOS  (tabla: usuario | columnas: usuar, pass)
# ═══════════════════════════════════════════════════════════════

@app.route('/usuarios', methods=['GET'])
def obtener_usuarios():
    conn   = get_connection()
    cursor = conn.cursor(dictionary=True)
    cursor.execute("SELECT id_usuar, usuar FROM usuario ORDER BY usuar")
    result = cursor.fetchall()
    conn.close()
    return jsonify(result)


@app.route('/usuarios', methods=['POST'])
def crear_usuario():
    data = request.get_json()
    
    if not data.get('usuar') or not data.get('pass'):
        return jsonify({'mensaje': 'Faltan credenciales'}), 400

    usuar = data['usuar']
    password = data['pass']
    
    # Hasheamos la contraseña antes de guardarla
    hashed_pass = generate_password_hash(password)

    conn = get_connection()
    cursor = conn.cursor()

    try:
        # Intentamos insertar el usuario
        cursor.execute(
            "INSERT INTO usuario (usuar, pass) VALUES (%s, %s)",
            (usuar, hashed_pass)
        )
        conn.commit()
        nuevo_id = cursor.lastrowid
        
        return jsonify({'mensaje': 'Usuario creado', 'id_usuar': nuevo_id}), 201
        
    except mysql.connector.Error as err:
        # El código 1062 en MySQL significa "Duplicate entry" (Entrada duplicada)
        if err.errno == 1062:
            return jsonify({'mensaje': 'El nombre de usuario ya existe'}), 409
        else:
            # Si es otro error de base de datos, mandamos un 500
            return jsonify({'mensaje': 'Error interno de la base de datos'}), 500
            
    finally:
        # Esto asegura que la conexión siempre se cierre, haya error o no
        cursor.close()
        conn.close()

# ═══════════════════════════════════════════════════════════════
#  DASHBOARD
#  Muestra el resumen de la semana actual y el producto más
#  vendido (en kilos) de todas las semanas registradas.
# ═══════════════════════════════════════════════════════════════

@app.route('/dashboard', methods=['GET'])
def dashboard():
    inicio = request.args.get('fecha')
    
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    # 1. Definir la semana actual (o la solicitada)
    # MODIFICACIÓN: Ahora seleccionamos también SUM(r.ingreso)
    query_base = """
        SELECT p.nam AS nombre, SUM(r.kilos) AS total_kilos, SUM(r.ingreso) AS total_ingresos
        FROM registro_semanal r
        JOIN producfo p ON p.id_produc = r.id_produc
        WHERE r.semana_inicio = %s
        GROUP BY p.nam
    """

    if not inicio:
        cursor.execute("SELECT MAX(semana_inicio) as max_fecha FROM registro_semanal")
        res = cursor.fetchone()
        inicio = str(res['max_fecha']) if res['max_fecha'] else None
        
    cursor.execute(query_base, (inicio,))
    semana_actual = cursor.fetchall()

    # 2. Calcular total de la semana SUMANDO EL DINERO
    # Cambiamos 'total' por 'total_ingresos' que es el nombre de la columna que definimos arriba
    total_semana = sum(float(item['total_ingresos'] or 0) for item in semana_actual)

    # 3. Total histórico (de toda la tabla - Dinero)
    cursor.execute("SELECT SUM(ingreso) as total FROM registro_semanal")
    total_historico = cursor.fetchone()['total'] or 0

    # 4. Total de semanas registradas
    cursor.execute("SELECT COUNT(DISTINCT semana_inicio) AS semanas FROM registro_semanal")
    num_semanas = cursor.fetchone()['semanas']

    # 5. Top 5 productos más vendidos (Histórico en kilos)
    cursor.execute("""
        SELECT p.nam AS nombre, SUM(r.kilos) as total_kilos
        FROM registro_semanal r
        JOIN producfo p ON p.id_produc = r.id_produc
        GROUP BY p.nam
        ORDER BY total_kilos DESC
        LIMIT 5
    """)
    top_productos = cursor.fetchall()

    conn.close()

    return jsonify({
        'semana_inicio': inicio,
        'semana_actual': semana_actual,
        'total_semana': total_semana, # Ahora este valor es el dinero total de la semana
        'total_historico': total_historico,
        'semanas_registradas': num_semanas,
        'top_productos': top_productos
    })
    
# ═══════════════════════════════════════════════════════════════
# LOGIN
# ═══════════════════════════════════════════════════════════════

@app.route('/login', methods=['POST'])
def login():

    data = request.get_json()

    if not data.get('usuar') or not data.get('pass'):
        return jsonify({
            'mensaje': 'Faltan credenciales'
        }), 400

    conn = get_connection()
    cursor = conn.cursor(dictionary=True)

    cursor.execute(
        "SELECT * FROM usuario WHERE usuar = %s",
        (data['usuar'],)
    )

    usuario = cursor.fetchone()

    conn.close()

    if usuario and check_password_hash(usuario['pass'], data['pass']):

        return jsonify({
            'mensaje': 'Login correcto',
            'usuario': {
                'id_usuar': usuario['id_usuar'],
                'usuar': usuario['usuar']
            }
        }), 200

    return jsonify({
        'mensaje': 'Usuario o contraseña incorrectos'
    }), 401

if __name__ == '__main__':
    app.run(debug=True)

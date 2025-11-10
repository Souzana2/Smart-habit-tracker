from flask import Flask, request, jsonify, session, redirect, url_for, render_template_string
import pyodbc
import json
import os
import hashlib

app = Flask(__name__)
app.secret_key = 'your_super_secret_key'  # Troque por uma chave segura
app.static_folder = os.getcwd()

@app.route('/')
def index():
    if 'user_id' not in session:
        return redirect(url_for('login_endpoint'))
    return app.send_static_file('index.html')

@app.route('/login')
def login_endpoint():
    return app.send_static_file('login.html')

@app.route('/register')
def register_endpoint():
    return app.send_static_file('register.html')

@app.route('/logout')
def logout_endpoint():
    session.pop('user_id', None)
    return redirect(url_for('login_endpoint'))

@app.route('/api/login', methods=['POST'])
def api_login():
    try:
        data = request.get_json()
        if not data or 'username' not in data or 'password' not in data:
            return jsonify({'success': False, 'message': 'Dados inválidos'}), 400

        user = get_user(data['username'])
        if user and user['password'] == hash_password(data['password']):
            session['user_id'] = user['id']
            return jsonify({'success': True})
        
        return jsonify({'success': False, 'message': 'Usuário ou senha inválidos'}), 401
    except Exception as e:
        # Log do erro é uma boa prática
        print(f"Erro em /api/login: {e}")
        return jsonify({'success': False, 'message': 'Erro interno do servidor'}), 500

@app.route('/api/register', methods=['POST'])
def api_register():
    data = request.get_json()
    if create_user(data['username'], data['password']):
        return jsonify({'success': True})
    return jsonify({'success': False, 'message': 'Usuário já existe'})

@app.route('/styles.css')
def styles():
    return app.send_static_file('styles.css')

@app.route('/script.js')
def script():
    return app.send_static_file('script.js')

# Função para conectar ao banco de dados
def get_db_connection():
    conn = pyodbc.connect('DRIVER={SQL Server};SERVER=192.168.1.196,1433;DATABASE=SmartHabitTracker;UID=usuariosouza;PWD=124600;')
    return conn

# Função para hash de senha
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

# Função para obter usuário pelo username
def get_user(username):
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM users WHERE username = ?', (username,))
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        if user:
            return {'id': user[0], 'username': user[1], 'password': user[2]}
        return None
    except pyodbc.Error as ex:
        sqlstate = ex.args[0]
        print(f"Erro de banco de dados ao obter usuário: {sqlstate}")
        # Lançar a exceção para ser tratada pela rota
        raise

# Função para criar usuário
def create_user(username, password):
    try:
        if get_user(username):
            return False
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO users (username, password) VALUES (?, ?)', (username, hash_password(password)))
        conn.commit()
        cursor.close()
        conn.close()
        return True
    except pyodbc.Error as ex:
        sqlstate = ex.args[0]
        print(f"Erro de banco de dados ao criar usuário: {sqlstate}")
        raise

# Rota para obter hábitos
@app.route('/api/habits', methods=['GET'])
def get_habits():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    user_id = session['user_id']
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, days FROM habits WHERE user_id = ?', (user_id,))
    habits = cursor.fetchall()
    cursor.close()
    conn.close()

    result = []
    for habit in habits:
        result.append({
            'id': habit[0],
            'name': habit[1],
            'user_id': user_id,
            'days': json.loads(habit[2]) if habit[2] else {}
        })
    return jsonify({'habits': result})

# Rota para salvar hábitos (atualizada)
@app.route('/api/habits', methods=['POST'])
def add_habits():
    if 'user_id' not in session:
        return jsonify({'error': 'Unauthorized'}), 401
    user_id = session['user_id']
    data = request.get_json()
    incoming_habits = data.get('habits', [])

    conn = get_db_connection()
    cursor = conn.cursor()

    # Obter IDs dos hábitos existentes no banco de dados
    cursor.execute('SELECT id FROM habits WHERE user_id = ?', (user_id,))
    db_habit_ids = {row[0] for row in cursor.fetchall()}

    incoming_habit_ids = set()

    for habit in incoming_habits:
        habit_id = habit.get('id')
        days_json = json.dumps(habit.get('days', {}))
        
        if habit_id and habit_id in db_habit_ids:
            # Atualizar hábito existente
            cursor.execute('UPDATE habits SET name = ?, days = ? WHERE id = ? AND user_id = ?', 
                           (habit['name'], days_json, habit_id, user_id))
            incoming_habit_ids.add(habit_id)
        else:
            # Inserir novo hábito
            cursor.execute('INSERT INTO habits (user_id, name, days) VALUES (?, ?, ?)', 
                           (user_id, habit['name'], days_json))

    # Apagar hábitos que foram removidos no frontend
    habits_to_delete = db_habit_ids - incoming_habit_ids
    if habits_to_delete:
        # O '?' não funciona com 'IN' diretamente em todas as bibliotecas, então formatamos a query
        delete_query = 'DELETE FROM habits WHERE user_id = ? AND id IN ({})'.format(','.join('?' for _ in habits_to_delete))
        params = [user_id] + list(habits_to_delete)
        cursor.execute(delete_query, params)

    conn.commit()
    cursor.close()
    conn.close()

    return jsonify({'status': 'success'})

if __name__ == '__main__':
    app.run(debug=True)

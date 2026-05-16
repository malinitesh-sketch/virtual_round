"""
Traveloop Backend — Flask REST API
Serves all API endpoints for the Traveloop travel planning application.
Uses a JSON file as a lightweight database.
"""

from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_cors import CORS
import json
import os
import sqlite3
import uuid
from datetime import datetime

# Serve frontend files from the ../frontend directory
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app)  # Enable CORS for frontend connection

# ===== DATABASE SETUP =====
DB_PATH = os.path.join(os.path.dirname(__file__), 'db.sqlite')
JSON_DB_PATH = os.path.join(os.path.dirname(__file__), 'db.json')
SQL_JSON_FIELDS = {'sections', 'days', 'categories', 'travelers', 'items', 'popularCities', 'popularActivities', 'monthlyTrends'}

def load_db():
    if not os.path.exists(JSON_DB_PATH):
        return {
            'users': [],
            'trips': [],
            'itineraries': [],
            'activities': [],
            'checklists': [],
            'community': [],
            'notes': [],
            'invoices': [],
            'admin': {}
        }
    with open(JSON_DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_db(data):
    with open(JSON_DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def get_db_conn():
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn

def row_to_dict(row):
    if row is None:
        return None

    result = dict(row)
    for key in SQL_JSON_FIELDS:
        if key in result and result[key] is not None:
            try:
                result[key] = json.loads(result[key])
            except (ValueError, TypeError):
                pass
    return result

def fetch_all(query, params=()):
    conn = get_db_conn()
    cursor = conn.execute(query, params)
    rows = [row_to_dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

def fetch_one(query, params=()):
    conn = get_db_conn()
    cursor = conn.execute(query, params)
    row = row_to_dict(cursor.fetchone())
    conn.close()
    return row

def execute_sql(query, params=()):
    conn = get_db_conn()
    cursor = conn.cursor()
    cursor.execute(query, params)
    conn.commit()
    lastrowid = cursor.lastrowid
    conn.close()
    return lastrowid

def is_table_empty(conn, table_name):
    cursor = conn.execute(f"SELECT COUNT(*) AS count FROM {table_name}")
    row = cursor.fetchone()
    return row['count'] == 0

def init_db():
    conn = get_db_conn()
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        name TEXT NOT NULL,
        first_name TEXT,
        last_name TEXT,
        phone TEXT,
        city TEXT,
        country TEXT,
        photo TEXT,
        created_at TEXT NOT NULL
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS trips (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        title TEXT,
        destination TEXT,
        start_date TEXT,
        end_date TEXT,
        status TEXT,
        budget REAL,
        spent REAL,
        cities INTEGER,
        created_at TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )
    """)

    conn.commit()

    if os.path.exists(JSON_DB_PATH) and is_table_empty(conn, 'users'):
        with open(JSON_DB_PATH, 'r', encoding='utf-8') as f:
            seed_data = json.load(f)

        for user in seed_data.get('users', []):
            cursor.execute(
                "INSERT OR IGNORE INTO users (id, email, password, name, first_name, last_name, phone, city, country, photo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    user.get('id'),
                    user.get('email', '').strip().lower(),
                    user.get('password', ''),
                    user.get('name', ''),
                    user.get('firstName', ''),
                    user.get('lastName', ''),
                    user.get('phone', ''),
                    user.get('city', ''),
                    user.get('country', ''),
                    user.get('photo', ''),
                    user.get('createdAt') or datetime.now().isoformat()
                ]
            )

        for trip in seed_data.get('trips', []):
            cursor.execute(
                "INSERT OR IGNORE INTO trips (id, user_id, title, destination, start_date, end_date, status, budget, spent, cities, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                [
                    trip.get('id'),
                    trip.get('userId'),
                    trip.get('title', ''),
                    trip.get('destination', ''),
                    trip.get('startDate', ''),
                    trip.get('endDate', ''),
                    trip.get('status', 'upcoming'),
                    trip.get('budget', 0),
                    trip.get('spent', 0),
                    trip.get('cities', 1),
                    trip.get('createdAt') or datetime.now().isoformat()
                ]
            )

        conn.commit()

    conn.close()


# ===== ROOT / HEALTH CHECK =====
@app.route('/')
def home():
    return app.send_static_file('index.html')

@app.route('/<path:path>')
def serve_frontend(path):
    # Serve the requested file from the frontend folder, or fallback to index.html
    if os.path.exists(os.path.join(FRONTEND_DIR, path)):
        return send_from_directory(FRONTEND_DIR, path)
    return app.send_static_file('index.html')

@app.route('/api/test', methods=['GET'])
def test():
    return jsonify({"message": "Backend is connected!", "timestamp": datetime.now().isoformat()})


# ===== AUTH ENDPOINTS =====
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))
    first_name = str(data.get('firstName', '')).strip()
    last_name = str(data.get('lastName', '')).strip()
    name = str(data.get('name', '')).strip() or f"{first_name} {last_name}".strip()
    phone = str(data.get('phone', '')).strip()
    city = str(data.get('city', '')).strip()
    country = str(data.get('country', '')).strip()
    photo = data.get('profilePic', '') or ''

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    existing_user = fetch_one("SELECT id FROM users WHERE email = ?", (email,))
    if existing_user:
        return jsonify({"error": "Email already registered"}), 400

    new_user_id = f"user-{uuid.uuid4().hex[:6]}"
    created_at = datetime.now().isoformat()

    execute_sql(
        "INSERT INTO users (id, email, password, name, first_name, last_name, phone, city, country, photo, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [new_user_id, email, password, name, first_name, last_name, phone, city, country, photo, created_at]
    )

    token = f"tok-{uuid.uuid4().hex}"
    user = {
        "id": new_user_id,
        "email": email,
        "name": name,
        "firstName": first_name,
        "lastName": last_name,
        "phone": phone,
        "city": city,
        "country": country,
        "photo": photo,
        "createdAt": created_at
    }

    return jsonify({"message": "Registration successful", "token": token, "user": user}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = str(data.get('email', '')).strip().lower()
    password = str(data.get('password', ''))

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    user = fetch_one("SELECT * FROM users WHERE email = ? AND password = ? LIMIT 1", (email, password))
    if not user:
        return jsonify({"error": "Invalid email or password"}), 401

    user.pop('password', None)
    token = f"tok-{uuid.uuid4().hex}"

    return jsonify({
        "message": "Login successful",
        "token": token,
        "user": user
    })


# ===== TRIPS ENDPOINTS =====
@app.route('/api/trips', methods=['GET'])
def get_trips():
    trips = fetch_all("SELECT * FROM trips ORDER BY created_at DESC")
    return jsonify(trips)

@app.route('/api/trips/<trip_id>', methods=['GET'])
def get_trip(trip_id):
    trip = fetch_one("SELECT * FROM trips WHERE id = ?", (trip_id,))
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    return jsonify(trip)

@app.route('/api/trips', methods=['POST'])
def create_trip():
    data = request.get_json() or {}
    user_id = data.get('userId')
    if not user_id:
        first_user = fetch_one("SELECT id FROM users ORDER BY created_at LIMIT 1")
        user_id = first_user.get('id') if first_user else 'user-001'

    new_trip = {
        "id": f"trip-{uuid.uuid4().hex[:6]}",
        "userId": user_id,
        "title": data.get('title', ''),
        "destination": data.get('destination', ''),
        "startDate": data.get('startDate', ''),
        "endDate": data.get('endDate', ''),
        "status": "upcoming",
        "budget": data.get('budget', 0),
        "spent": 0,
        "cities": data.get('cities', 1),
        "createdAt": datetime.now().isoformat()
    }

    execute_sql(
        "INSERT INTO trips (id, user_id, title, destination, start_date, end_date, status, budget, spent, cities, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
            new_trip['id'],
            new_trip['userId'],
            new_trip['title'],
            new_trip['destination'],
            new_trip['startDate'],
            new_trip['endDate'],
            new_trip['status'],
            new_trip['budget'],
            new_trip['spent'],
            new_trip['cities'],
            new_trip['createdAt']
        ]
    )

    return jsonify(new_trip), 201

@app.route('/api/trips/<trip_id>', methods=['PUT'])
def update_trip(trip_id):
    data = request.get_json() or {}
    trip = fetch_one("SELECT * FROM trips WHERE id = ?", (trip_id,))
    if not trip:
        return jsonify({"error": "Trip not found"}), 404

    field_map = {
        'title': 'title',
        'destination': 'destination',
        'startDate': 'start_date',
        'endDate': 'end_date',
        'status': 'status',
        'budget': 'budget',
        'spent': 'spent',
        'cities': 'cities'
    }
    updates = []
    values = []
    for key, column in field_map.items():
        if key in data:
            updates.append(f"{column} = ?")
            values.append(data[key])

    if updates:
        values.append(trip_id)
        execute_sql(f"UPDATE trips SET {', '.join(updates)} WHERE id = ?", tuple(values))

    updated_trip = fetch_one("SELECT * FROM trips WHERE id = ?", (trip_id,))
    return jsonify(updated_trip)

@app.route('/api/trips/<trip_id>', methods=['DELETE'])
def delete_trip(trip_id):
    execute_sql("DELETE FROM trips WHERE id = ?", (trip_id,))
    return jsonify({"message": "Trip deleted"})


# ===== ITINERARY ENDPOINTS =====
@app.route('/api/trips/<trip_id>/itinerary', methods=['GET'])
def get_itinerary(trip_id):
    db = load_db()
    itin = next((i for i in db['itineraries'] if i['tripId'] == trip_id), None)
    if not itin:
        return jsonify({"error": "Itinerary not found"}), 404
    return jsonify(itin)


# ===== ACTIVITIES ENDPOINTS =====
@app.route('/api/activities', methods=['GET'])
def get_activities():
    db = load_db()
    return jsonify(db['activities'])

@app.route('/api/activities', methods=['POST'])
def create_activity():
    data = request.get_json()
    db = load_db()
    
    new_activity = {
        "id": f"act-{uuid.uuid4().hex[:6]}",
        "name": data.get('name', ''),
        "type": data.get('type', ''),
        "price": data.get('price', 0),
        "location": data.get('location', ''),
        "rating": data.get('rating', 0)
    }
    
    db['activities'].append(new_activity)
    save_db(db)
    return jsonify(new_activity), 201

@app.route('/api/activities/<activity_id>', methods=['DELETE'])
def delete_activity(activity_id):
    db = load_db()
    db['activities'] = [a for a in db['activities'] if a['id'] != activity_id]
    save_db(db)
    return jsonify({"message": "Activity deleted"})


# ===== CHECKLIST ENDPOINTS =====
@app.route('/api/checklists', methods=['GET'])
def get_checklists():
    db = load_db()
    return jsonify(db['checklists'])

@app.route('/api/checklists/<checklist_id>', methods=['PUT'])
def update_checklist(checklist_id):
    data = request.get_json()
    db = load_db()
    
    for i, cl in enumerate(db['checklists']):
        if cl['id'] == checklist_id:
            db['checklists'][i].update(data)
            save_db(db)
            return jsonify(db['checklists'][i])
    
    return jsonify({"error": "Checklist not found"}), 404


# ===== COMMUNITY ENDPOINTS =====
@app.route('/api/community', methods=['GET'])
def get_community():
    db = load_db()
    return jsonify(db['community'])

@app.route('/api/community', methods=['POST'])
def create_post():
    data = request.get_json()
    db = load_db()
    
    new_post = {
        "id": f"post-{uuid.uuid4().hex[:6]}",
        "userId": data.get('userId', 'user-001'),
        "author": data.get('author', ''),
        "type": data.get('type', 'Post'),
        "content": data.get('content', ''),
        "likes": 0,
        "comments": 0,
        "createdAt": datetime.now().isoformat()
    }
    
    db['community'].append(new_post)
    save_db(db)
    return jsonify(new_post), 201


# ===== NOTES ENDPOINTS =====
@app.route('/api/notes', methods=['GET'])
def get_notes():
    db = load_db()
    trip_id = request.args.get('tripId')
    if trip_id:
        return jsonify([n for n in db['notes'] if n['tripId'] == trip_id])
    return jsonify(db['notes'])

@app.route('/api/notes', methods=['POST'])
def create_note():
    data = request.get_json()
    db = load_db()
    
    new_note = {
        "id": f"note-{uuid.uuid4().hex[:6]}",
        "tripId": data.get('tripId', 'trip-001'),
        "title": data.get('title', ''),
        "content": data.get('content', ''),
        "day": data.get('day', 1),
        "date": data.get('date', datetime.now().strftime('%Y-%m-%d')),
        "category": data.get('category', 'General')
    }
    
    db['notes'].append(new_note)
    save_db(db)
    return jsonify(new_note), 201


# ===== INVOICE ENDPOINTS =====
@app.route('/api/invoices', methods=['GET'])
def get_invoices():
    db = load_db()
    return jsonify(db['invoices'])

@app.route('/api/invoices/<invoice_id>', methods=['GET'])
def get_invoice(invoice_id):
    db = load_db()
    inv = next((i for i in db['invoices'] if i['id'] == invoice_id), None)
    if not inv:
        return jsonify({"error": "Invoice not found"}), 404
    return jsonify(inv)

@app.route('/api/invoices/<invoice_id>/mark-paid', methods=['PUT'])
def mark_paid(invoice_id):
    db = load_db()
    for i, inv in enumerate(db['invoices']):
        if inv['id'] == invoice_id:
            db['invoices'][i]['status'] = 'paid'
            save_db(db)
            return jsonify(db['invoices'][i])
    return jsonify({"error": "Invoice not found"}), 404


# ===== USER PROFILE ENDPOINTS =====
@app.route('/api/user/profile', methods=['GET'])
def get_profile():
    user_id = request.args.get('userId')
    user = None
    if user_id:
        user = fetch_one("SELECT * FROM users WHERE id = ?", (user_id,))
    else:
        user = fetch_one("SELECT * FROM users ORDER BY created_at LIMIT 1")

    if not user:
        return jsonify({"error": "No user found"}), 404

    user.pop('password', None)
    return jsonify(user)

@app.route('/api/user/profile', methods=['PUT'])
def update_profile():
    data = request.get_json() or {}
    user_id = request.args.get('userId')

    if not user_id:
        first_user = fetch_one("SELECT id FROM users ORDER BY created_at LIMIT 1")
        user_id = first_user.get('id') if first_user else None

    if not user_id:
        return jsonify({"error": "User not found"}), 404

    field_map = {
        'name': 'name',
        'firstName': 'first_name',
        'lastName': 'last_name',
        'phone': 'phone',
        'city': 'city',
        'country': 'country',
        'photo': 'photo',
        'email': 'email'
    }

    updates = []
    values = []
    for key, column in field_map.items():
        if key in data:
            updates.append(f"{column} = ?")
            values.append(data[key])

    if not updates:
        return jsonify({"error": "No valid profile fields provided"}), 400

    values.append(user_id)
    execute_sql(f"UPDATE users SET {', '.join(updates)} WHERE id = ?", tuple(values))

    user = fetch_one("SELECT * FROM users WHERE id = ?", (user_id,))
    if not user:
        return jsonify({"error": "User not found"}), 404

    user.pop('password', None)
    return jsonify(user)


# ===== ADMIN ENDPOINTS =====
@app.route('/api/admin/analytics', methods=['GET'])
def get_analytics():
    db = load_db()
    return jsonify(db['admin'])

@app.route('/api/admin/users', methods=['GET'])
def get_all_users():
    db = load_db()
    users = [{k: v for k, v in u.items() if k != 'password'} for u in db['users']]
    return jsonify(users)


# ===== RUN SERVER =====
if __name__ == '__main__':
    # Initialize DB if it doesn't exist
    if not os.path.exists(DB_PATH):
        init_db()
        print("[OK] Database initialized with seed data")
    
    print("[START] Traveloop Backend starting on http://localhost:5000")
    app.run(debug=True, host='0.0.0.0', port=5000)

"""
Traveloop Backend — Flask REST API
Serves all API endpoints for the Traveloop travel planning application.
Uses a JSON file as a lightweight database.
"""

from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_cors import CORS
import json
import os
import uuid
from datetime import datetime

# Serve frontend files from the ../frontend directory
FRONTEND_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'frontend'))

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app)  # Enable CORS for frontend connection

# ===== DATABASE SETUP =====
DB_PATH = os.path.join(os.path.dirname(__file__), 'db.json')

def load_db():
    """Load the JSON database file."""
    if not os.path.exists(DB_PATH):
        init_db()
    with open(DB_PATH, 'r', encoding='utf-8') as f:
        return json.load(f)

def save_db(data):
    """Save data to the JSON database file."""
    with open(DB_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def init_db():
    """Initialize database with seed data."""
    seed_data = {
        "users": [
            {
                "id": "user-001",
                "email": "james@example.com",
                "password": "password123",
                "name": "James Anderson",
                "firstName": "James",
                "lastName": "Anderson",
                "phone": "+1 234 567 890",
                "city": "New York",
                "country": "United States",
                "photo": "",
                "createdAt": "2024-01-15T10:00:00Z"
            },
            {
                "id": "user-002",
                "email": "sarah@example.com",
                "password": "password123",
                "name": "Sarah Adams",
                "firstName": "Sarah",
                "lastName": "Adams",
                "phone": "+1 987 654 321",
                "city": "London",
                "country": "United Kingdom",
                "photo": "",
                "createdAt": "2024-02-20T14:30:00Z"
            },
            {
                "id": "user-003",
                "email": "mike@example.com",
                "password": "password123",
                "name": "Mike Kumar",
                "firstName": "Mike",
                "lastName": "Kumar",
                "phone": "+91 98765 43210",
                "city": "Mumbai",
                "country": "India",
                "photo": "",
                "createdAt": "2024-03-10T09:15:00Z"
            }
        ],
        "trips": [
            {
                "id": "trip-001",
                "userId": "user-001",
                "title": "Europe Adventure 2025",
                "destination": "Paris, Rome, Swiss Alps",
                "startDate": "2025-06-10",
                "endDate": "2025-06-20",
                "status": "ongoing",
                "budget": 13500,
                "spent": 9800,
                "cities": 4,
                "createdAt": "2025-05-01T10:00:00Z"
            },
            {
                "id": "trip-002",
                "userId": "user-001",
                "title": "Tokyo Exploration",
                "destination": "Tokyo, Kyoto",
                "startDate": "2025-07-15",
                "endDate": "2025-07-25",
                "status": "upcoming",
                "budget": 8000,
                "spent": 0,
                "cities": 2,
                "createdAt": "2025-04-20T10:00:00Z"
            },
            {
                "id": "trip-003",
                "userId": "user-001",
                "title": "Bali Adventure",
                "destination": "Bali",
                "startDate": "2024-12-10",
                "endDate": "2024-12-20",
                "status": "completed",
                "budget": 5000,
                "spent": 4800,
                "cities": 3,
                "createdAt": "2024-11-01T10:00:00Z"
            }
        ],
        "itineraries": [
            {
                "id": "itin-001",
                "tripId": "trip-001",
                "sections": [
                    {"name": "Paris — City Exploration", "dateRange": "Jun 10 – Jun 13", "budget": 4500, "info": "Explore iconic landmarks, enjoy French cuisine, and visit world-renowned museums."},
                    {"name": "Rome — Historical Tour", "dateRange": "Jun 14 – Jun 17", "budget": 3800, "info": "Visit the Colosseum, Vatican City, and the Trevi Fountain."},
                    {"name": "Swiss Alps — Adventure", "dateRange": "Jun 18 – Jun 20", "budget": 5200, "info": "Hiking, skiing, and breathtaking mountain views."}
                ],
                "days": [
                    {"day": 1, "title": "Arrival in Paris", "description": "Arrive at CDG Airport, transfer to hotel, evening walk along Seine River"},
                    {"day": 2, "title": "Paris Exploration", "description": "Visit Eiffel Tower, Louvre Museum, Champs-Élysées, French dinner"},
                    {"day": 3, "title": "Travel to Rome", "description": "Morning flight to Rome, check-in at hotel, evening Colosseum visit"},
                    {"day": 4, "title": "Rome Discovery", "description": "Vatican City, Trevi Fountain, Spanish Steps, authentic Italian pizza"}
                ]
            }
        ],
        "activities": [
            {"id": "act-001", "name": "Paragliding — Interlaken", "type": "Adventure", "price": 180, "location": "Swiss Alps", "rating": 4.8},
            {"id": "act-002", "name": "Scuba Diving — Maldives", "type": "Water Sport", "price": 250, "location": "Maldives", "rating": 4.9},
            {"id": "act-003", "name": "Art Tour — Florence", "type": "Cultural", "price": 95, "location": "Florence", "rating": 4.7},
            {"id": "act-004", "name": "Hiking — Machu Picchu", "type": "Nature", "price": 320, "location": "Peru", "rating": 4.9},
            {"id": "act-005", "name": "Food Tour — Tokyo", "type": "Culinary", "price": 75, "location": "Tokyo", "rating": 4.6},
            {"id": "act-006", "name": "Sailing — Santorini", "type": "Water Sport", "price": 200, "location": "Santorini", "rating": 4.8}
        ],
        "checklists": [
            {
                "id": "check-001",
                "tripId": "trip-001",
                "tripName": "Paris & Rome Adventure",
                "categories": [
                    {"name": "Documents", "items": [
                        {"name": "Passport", "packed": True},
                        {"name": "Flight Tickets (printed)", "packed": True},
                        {"name": "Travel Insurance", "packed": True},
                        {"name": "Hotel Booking Confirmation", "packed": False}
                    ]},
                    {"name": "Clothing", "items": [
                        {"name": "Casual Shirts", "packed": True},
                        {"name": "Trousers / Jeans", "packed": False},
                        {"name": "Comfortable Walking Shoes", "packed": False},
                        {"name": "Light Jacket / Windbreaker", "packed": False}
                    ]},
                    {"name": "Electronics", "items": [
                        {"name": "Phone Charger", "packed": True},
                        {"name": "Universal Power Adapter", "packed": False},
                        {"name": "Earphones / Headphones", "packed": False}
                    ]}
                ]
            }
        ],
        "community": [
            {"id": "post-001", "userId": "user-002", "author": "Sarah Adams", "type": "Travel Tip", "content": "Just got back from Bali! Pro tip: Visit Tegallalang Rice Terraces early morning.", "likes": 42, "comments": 8, "createdAt": "2025-06-10T08:00:00Z"},
            {"id": "post-002", "userId": "user-003", "author": "Mike Kumar", "type": "Review", "content": "Tokyo food tour was incredible! Tsukiji Outer Market is a must-visit.", "likes": 89, "comments": 15, "createdAt": "2025-06-10T05:00:00Z"},
            {"id": "post-003", "userId": "user-002", "author": "Laura Peterson", "type": "Question", "content": "Planning a 2-week Europe trip! Has anyone done Paris → Rome → Swiss Alps?", "likes": 23, "comments": 31, "createdAt": "2025-06-09T12:00:00Z"}
        ],
        "notes": [
            {"id": "note-001", "tripId": "trip-001", "title": "Hotel check-in details — Paris", "content": "Check in after 2 PM, Room 415, breakfast included (7–10 AM).", "day": 1, "date": "2025-06-10", "category": "Hotel"},
            {"id": "note-002", "tripId": "trip-001", "title": "Best photo spots — Eiffel Tower", "content": "Trocadéro Gardens has the best view. Go early morning for fewer crowds.", "day": 2, "date": "2025-06-11", "category": "Sightseeing"},
            {"id": "note-003", "tripId": "trip-001", "title": "Hotel check-in details — Rome", "content": "Check in after 2 PM, Room 302, breakfast included (7–10 AM).", "day": 3, "date": "2025-06-14", "category": "Hotel"}
        ],
        "invoices": [
            {
                "id": "INV-xyz-30290",
                "tripId": "trip-001",
                "tripTitle": "Trip to Europe Adventure",
                "travelers": ["James", "Arjun", "Jerry", "Cristina"],
                "generatedDate": "2025-05-20",
                "status": "pending",
                "items": [
                    {"category": "Hotel", "description": "Hotel Booking — Paris", "qty": "3 nights", "unitCost": 3000, "amount": 9000},
                    {"category": "Travel", "description": "Flight Bookings (DEL → PAR)", "qty": "1", "unitCost": 12000, "amount": 12000},
                    {"category": "Activity", "description": "Eiffel Tower Tour", "qty": "4 persons", "unitCost": 50, "amount": 200},
                    {"category": "Food", "description": "Dining — Paris restaurants", "qty": "3 days", "unitCost": 150, "amount": 450}
                ],
                "subtotal": 21650,
                "tax": 1082,
                "discount": 732,
                "grandTotal": 22000,
                "budgetTotal": 20000,
                "budgetSpent": 22000,
                "budgetRemaining": -2000
            }
        ],
        "admin": {
            "totalUsers": 1247,
            "totalTrips": 3891,
            "citiesCovered": 156,
            "revenue": 2400000,
            "popularCities": [
                {"name": "Paris", "percentage": 92},
                {"name": "Tokyo", "percentage": 85},
                {"name": "Rome", "percentage": 78},
                {"name": "Bali", "percentage": 71}
            ],
            "popularActivities": [
                {"name": "Hiking", "percentage": 88},
                {"name": "Scuba Diving", "percentage": 75},
                {"name": "Food Tours", "percentage": 82},
                {"name": "Paragliding", "percentage": 60}
            ],
            "monthlyTrends": [
                {"month": "Jan", "value": 40},
                {"month": "Feb", "value": 55},
                {"month": "Mar", "value": 50},
                {"month": "Apr", "value": 70},
                {"month": "May", "value": 85},
                {"month": "Jun", "value": 95}
            ]
        }
    }
    save_db(seed_data)


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
    data = request.get_json()
    db = load_db()
    
    # Check if email already exists
    for user in db['users']:
        if user['email'] == data.get('email'):
            return jsonify({"error": "Email already registered"}), 400
    
    new_user = {
        "id": f"user-{uuid.uuid4().hex[:6]}",
        "email": data.get('email', ''),
        "password": data.get('password', ''),
        "name": f"{data.get('firstName', '')} {data.get('lastName', '')}".strip() or data.get('name', ''),
        "firstName": data.get('firstName', ''),
        "lastName": data.get('lastName', ''),
        "phone": data.get('phone', ''),
        "city": data.get('city', ''),
        "country": data.get('country', ''),
        "photo": "",
        "createdAt": datetime.now().isoformat()
    }
    
    db['users'].append(new_user)
    save_db(db)
    
    token = f"tok-{uuid.uuid4().hex}"
    return jsonify({"message": "Registration successful", "token": token, "user": {k: v for k, v in new_user.items() if k != 'password'}}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    db = load_db()
    
    email = data.get('email', '')
    password = data.get('password', '')
    
    for user in db['users']:
        if user['email'] == email and user['password'] == password:
            token = f"tok-{uuid.uuid4().hex}"
            return jsonify({
                "message": "Login successful",
                "token": token,
                "user": {k: v for k, v in user.items() if k != 'password'}
            })
    
    return jsonify({"error": "Invalid email or password"}), 401


# ===== TRIPS ENDPOINTS =====
@app.route('/api/trips', methods=['GET'])
def get_trips():
    db = load_db()
    return jsonify(db['trips'])

@app.route('/api/trips/<trip_id>', methods=['GET'])
def get_trip(trip_id):
    db = load_db()
    trip = next((t for t in db['trips'] if t['id'] == trip_id), None)
    if not trip:
        return jsonify({"error": "Trip not found"}), 404
    return jsonify(trip)

@app.route('/api/trips', methods=['POST'])
def create_trip():
    data = request.get_json()
    db = load_db()
    
    new_trip = {
        "id": f"trip-{uuid.uuid4().hex[:6]}",
        "userId": data.get('userId', 'user-001'),
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
    
    db['trips'].append(new_trip)
    save_db(db)
    return jsonify(new_trip), 201

@app.route('/api/trips/<trip_id>', methods=['PUT'])
def update_trip(trip_id):
    data = request.get_json()
    db = load_db()
    
    for i, trip in enumerate(db['trips']):
        if trip['id'] == trip_id:
            db['trips'][i].update(data)
            save_db(db)
            return jsonify(db['trips'][i])
    
    return jsonify({"error": "Trip not found"}), 404

@app.route('/api/trips/<trip_id>', methods=['DELETE'])
def delete_trip(trip_id):
    db = load_db()
    db['trips'] = [t for t in db['trips'] if t['id'] != trip_id]
    save_db(db)
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
    db = load_db()
    user_id = request.args.get('userId')
    
    user = None
    if user_id:
        user = next((u for u in db['users'] if u['id'] == user_id), None)
    
    if not user and db['users']:
        user = db['users'][0]
        
    if not user:
        return jsonify({"error": "No user found"}), 404
    return jsonify({k: v for k, v in user.items() if k != 'password'})

@app.route('/api/user/profile', methods=['PUT'])
def update_profile():
    data = request.get_json()
    db = load_db()
    user_id = request.args.get('userId')
    
    for i, u in enumerate(db['users']):
        if (user_id and u['id'] == user_id) or (not user_id and i == 0):
            db['users'][i].update({k: v for k, v in data.items() if k != 'password' and k != 'id'})
            save_db(db)
            return jsonify({k: v for k, v in db['users'][i].items() if k != 'password'})
            
    return jsonify({"error": "User not found"}), 404


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

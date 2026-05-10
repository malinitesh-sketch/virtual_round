from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# Enable frontend-backend connection
CORS(app)

# Home route
@app.route("/")
def home():
    return jsonify({
        "message": "Backend is running successfully"
    })


# Register API
@app.route("/register", methods=["POST"])
def register():

    # Get data from frontend
    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    # Validation
    if not username or not password:
        return jsonify({
            "success": False,
            "message": "Username and password required"
        }), 400

    # Success response
    return jsonify({
        "success": True,
        "message": "Registration successful",
        "username": username
    }), 200


# Login API
@app.route("/login", methods=["POST"])
def login():

    data = request.get_json()

    username = data.get("username")
    password = data.get("password")

    # Dummy login check
    if username == "admin" and password == "1234":
        return jsonify({
            "success": True,
            "message": "Login successful"
        }), 200

    return jsonify({
        "success": False,
        "message": "Invalid username or password"
    }), 401


# Run server
if __name__ == "__main__":
    app.run(debug=True)
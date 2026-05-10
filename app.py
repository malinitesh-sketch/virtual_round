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

    try:
        # Get JSON data
        data = request.get_json()

        print("Received Data:", data)

        # Check if data exists
        if data is None:
            return jsonify({
                "success": False,
                "message": "No JSON data received"
            }), 400

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

    except Exception as e:
        print("ERROR:", str(e))

        return jsonify({
            "success": False,
            "message": str(e)
        }), 500


# Run server
if __name__ == "__main__":
    app.run(debug=True)
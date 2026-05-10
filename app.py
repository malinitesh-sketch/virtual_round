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

        data = request.get_json(force=True)

        print("Received Data:", data)

        name = data.get("name")
        email = data.get("email")
        password = data.get("password")

        # Validation
        if not name or not email or not password:
            return jsonify({
                "success": False,
                "message": "All fields are required"
            }), 400

        return jsonify({
            "success": True,
            "message": "Registration successful",
            "name": name,
            "email": email
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
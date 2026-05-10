from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route("/register", methods=["POST"])
def register():
    data = request.json

    print(data)

    return jsonify({
        "success": True,
        "message": "User registered"
    })

if __name__ == "__main__":
    app.run(debug=True)
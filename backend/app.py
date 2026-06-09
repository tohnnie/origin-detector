from flask import Flask, request, jsonify
from flask_cors import CORS
from detector import analyze_text, analyze_image
import base64
import os

app = Flask(__name__)
CORS(app)

ALLOWED_EXTENSIONS = {"txt", "png", "jpg", "jpeg", "webp"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/", methods=["GET"])
def home():
    return jsonify({"status": "Origin Detector API is running"})


@app.route("/analyze/text", methods=["POST"])
def analyze_text_route():
    data = request.get_json()
    if not data or "text" not in data:
        return jsonify({"error": "No text provided"}), 400
    text = data["text"].strip()
    if len(text) < 50:
        return jsonify({"error": "Text too short. Minimum 50 characters."}), 400
    if len(text) > 10000:
        return jsonify({"error": "Text too long. Maximum 10,000 characters."}), 400
    try:
        result = analyze_text(text)
        return jsonify({"success": True, "type": "text", "result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/analyze/image", methods=["POST"])
def analyze_image_route():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    file = request.files["file"]
    if not allowed_file(file.filename):
        return jsonify({"error": "File type not supported."}), 400
    try:
        file_bytes = file.read()
        image_b64 = base64.standard_b64encode(file_bytes).decode("utf-8")
        ext = file.filename.rsplit(".", 1)[1].lower()
        media_types = {
            "jpg": "image/jpeg",
            "jpeg": "image/jpeg",
            "png": "image/png",
            "webp": "image/webp"
        }
        media_type = media_types.get(ext, "image/jpeg")
        result = analyze_image(image_b64, media_type)
        return jsonify({"success": True, "type": "image", "result": result})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    app.run(debug=True, port=5000)
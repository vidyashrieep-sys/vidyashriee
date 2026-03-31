import os
import re

from flask import Flask, jsonify, render_template, request

from backend.database import get_visitors, increment_visitors, init_db, list_contacts, save_contact


app = Flask(__name__, template_folder="templates", static_folder="static")


EMAIL_RE = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


@app.before_request
def _setup_once():
    if not getattr(app, "_db_ready", False):
        init_db()
        app._db_ready = True


@app.get("/")
def home():
    return render_template("index.html")


@app.get("/admin")
def admin():
    contacts = list_contacts()
    visitors = get_visitors()
    return render_template("admin.html", contacts=contacts, visitors=visitors)


@app.get("/api/health")
def health():
    return jsonify({"status": "ok"})


@app.post("/api/contact")
def api_contact():
    data = request.get_json(silent=True) or {}
    name = (data.get("name") or "").strip()
    email = (data.get("email") or "").strip()
    message = (data.get("message") or "").strip()

    if not name or not email or not message:
        return jsonify({"ok": False, "error": "name, email and message are required"}), 400
    if not EMAIL_RE.match(email):
        return jsonify({"ok": False, "error": "invalid email"}), 400

    save_contact(name, email, message)
    return jsonify({"ok": True, "message": "Contact saved"})


@app.get("/api/contacts")
def api_contacts():
    return jsonify({"ok": True, "contacts": list_contacts()})


@app.post("/api/visit")
def api_visit():
    visitors = increment_visitors()
    return jsonify({"ok": True, "visitors": visitors})


@app.get("/api/visitors")
def api_visitors():
    return jsonify({"ok": True, "visitors": get_visitors()})


if __name__ == "__main__":
    port = int(os.getenv("PORT", "5000"))
    app.run(host="0.0.0.0", port=port, debug=True)

from flask import jsonify
from database.connection import init_db

DB_READY = True
DB_ERROR = None

try:
    init_db()
except RuntimeError as exc:
    DB_READY = False
    DB_ERROR = str(exc)

def error_response(message, status_code=400):
    return jsonify({"error": message}), status_code

def database_unavailable_response():
    return error_response(DB_ERROR or "Database is unavailable.", 503)

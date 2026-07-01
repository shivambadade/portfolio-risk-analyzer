import os
from functools import wraps
from flask import request, jsonify
import jwt
from repositories.user_repository import UserRepository

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-fallback-for-dev")

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        if "Authorization" in request.headers:
            parts = request.headers["Authorization"].split()
            if len(parts) == 2 and parts[0] == "Bearer":
                token = parts[1]

        if not token:
            return jsonify({"error": "Token is missing."}), 401

        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
            current_user = UserRepository.get_user_by_email(data["email"])
            if not current_user:
                return jsonify({"error": "Invalid token user."}), 401
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired."}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token."}), 401
        except Exception as e:
            return jsonify({"error": str(e)}), 500

        return f(current_user, *args, **kwargs)

    return decorated

def admin_required(f):
    @wraps(f)
    def decorated(current_user, *args, **kwargs):
        if not current_user or current_user.get("role") not in ["admin", "superadmin"]:
            return jsonify({"error": "Admin privileges required."}), 403
        return f(current_user, *args, **kwargs)

    return decorated

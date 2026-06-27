from flask import Blueprint, jsonify, request
from repositories.user_repository import UserRepository
from utils import DB_READY, database_unavailable_response, error_response

user_routes = Blueprint("users", __name__)

@user_routes.route("/users", methods=["POST"])
def create_user_endpoint():
    if not DB_READY:
        return database_unavailable_response()
    
    data = request.get_json(silent=True) or {}
    try:
        user = UserRepository.create_user(data.get("name"), data.get("email"))
    except ValueError as exc:
        return error_response(str(exc), 422)
    except Exception:
        return error_response("Unable to save user.", 500)
    
    return jsonify({"message": "User saved successfully.", "user": user}), 201

@user_routes.route("/users", methods=["GET"])
def users_endpoint():
    if not DB_READY:
        return database_unavailable_response()
    try:
        return jsonify({"users": UserRepository.list_users()})
    except Exception:
        return error_response("Unable to load users.", 500)

@user_routes.route("/user/<int:user_id>", methods=["GET"])
def user_endpoint(user_id):
    if not DB_READY:
        return database_unavailable_response()
    
    user = UserRepository.get_user(user_id)
    if user is None:
        return error_response("User not found.", 404)
    return jsonify(user)

from flask import Blueprint, jsonify, request
from middleware.auth import token_required, admin_required
from services.admin_service import AdminService
from repositories.user_repository import UserRepository
from repositories.admin_repository import AdminRepository
from utils import DB_READY, database_unavailable_response, error_response

admin_routes = Blueprint("admin", __name__)

@admin_routes.route("/api/admin/login", methods=["POST"])
def login():
    if not DB_READY:
        return database_unavailable_response()
    
    data = request.get_json(silent=True) or {}
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return error_response("Email and password are required.", 400)
    
    result, error = AdminService.login(email, password)
    if error:
        return error_response(error, 401)
        
    return jsonify(result), 200

@admin_routes.route("/api/admin/dashboard", methods=["GET"])
@token_required
@admin_required
def dashboard(current_user):
    stats = AdminRepository.get_dashboard_stats()
    # Mock statuses
    stats["mongodb_status"] = "Connected" if DB_READY else "Disconnected"
    stats["groq_api_status"] = "Operational"
    stats["yahoo_finance_status"] = "Operational"
    return jsonify(stats), 200

@admin_routes.route("/api/admin/users", methods=["GET"])
@token_required
@admin_required
def get_users(current_user):
    users = UserRepository.list_users()
    return jsonify({"users": users}), 200

@admin_routes.route("/api/admin/user/<int:user_id>", methods=["GET"])
@token_required
@admin_required
def get_user(current_user, user_id):
    user = UserRepository.get_user(user_id)
    if not user:
        return error_response("User not found.", 404)
    return jsonify(user), 200

@admin_routes.route("/api/admin/user/<int:user_id>", methods=["PUT"])
@token_required
@admin_required
def update_user(current_user, user_id):
    data = request.get_json(silent=True) or {}
    # Only allow safe updates
    update_data = {}
    if "is_active" in data:
        update_data["is_active"] = bool(data["is_active"])
    if "role" in data:
        update_data["role"] = str(data["role"])
    
    if not update_data:
        return error_response("No valid fields to update.", 400)
        
    updated = UserRepository.update_user(user_id, update_data)
    if not updated:
        return error_response("User not found.", 404)
        
    return jsonify({"message": "User updated.", "user": updated}), 200

@admin_routes.route("/api/admin/user/<int:user_id>", methods=["DELETE"])
@token_required
@admin_required
def delete_user(current_user, user_id):
    if current_user.get("user_id") == user_id:
        return error_response("Cannot delete your own account.", 400)
    
    UserRepository.delete_user(user_id)
    return jsonify({"message": "User deleted."}), 200

@admin_routes.route("/api/admin/analytics", methods=["GET"])
@token_required
@admin_required
def get_analytics(current_user):
    analytics = AdminRepository.get_analytics()
    return jsonify(analytics), 200

@admin_routes.route("/api/admin/reports", methods=["GET"])
@token_required
@admin_required
def get_reports(current_user):
    # Dummy data for now
    return jsonify({"reports": []}), 200

@admin_routes.route("/api/admin/settings", methods=["GET"])
@token_required
@admin_required
def get_settings(current_user):
    return jsonify({
        "app_version": "1.0.0",
        "mongodb_status": "Connected" if DB_READY else "Disconnected",
        "groq_api_status": "Operational",
        "yahoo_finance_status": "Operational",
        "environment": "Development"
    }), 200

@admin_routes.route("/api/admin/settings", methods=["PUT"])
@token_required
@admin_required
def update_settings(current_user):
    return jsonify({"message": "Settings updated (mocked)."}), 200

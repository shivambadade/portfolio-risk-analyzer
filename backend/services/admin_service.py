import os
import bcrypt
import jwt
from datetime import datetime, timedelta
from repositories.user_repository import UserRepository

JWT_SECRET = os.getenv("JWT_SECRET", "super-secret-key-fallback-for-dev")

class AdminService:
    @staticmethod
    def init_admin():
        admin_email = os.getenv("ADMIN_EMAIL", "admin@portfolioai.com")
        admin_password = os.getenv("ADMIN_PASSWORD", "Admin@123")
        
        user = UserRepository.get_user_by_email(admin_email)
        if not user:
            hashed = bcrypt.hashpw(admin_password.encode("utf-8"), bcrypt.gensalt())
            UserRepository.create_user(
                name="System Admin",
                email=admin_email,
                password=hashed.decode("utf-8"),
                role="superadmin"
            )

    @staticmethod
    def login(email, password):
        user = UserRepository.get_user_by_email(email)
        if not user or not user.get("password"):
            return None, "Invalid email or password."

        if user.get("role") not in ["admin", "superadmin"]:
            return None, "Unauthorized."

        if not user.get("is_active"):
            return None, "Account is disabled."

        if bcrypt.checkpw(password.encode("utf-8"), user["password"].encode("utf-8")):
            # Update last login
            UserRepository.update_user(user["user_id"], {"last_login": datetime.utcnow().isoformat() + "Z"})
            
            token = jwt.encode({
                "user_id": user["user_id"],
                "email": user["email"],
                "role": user["role"],
                "exp": datetime.utcnow() + timedelta(hours=12)
            }, JWT_SECRET, algorithm="HS256")
            
            # Serialize for response
            user_data = dict(user)
            user_data.pop("_id", None)
            user_data.pop("password", None)
            
            return {"token": token, "user": user_data}, None
        else:
            return None, "Invalid email or password."

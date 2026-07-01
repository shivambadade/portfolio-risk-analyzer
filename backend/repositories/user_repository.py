from datetime import datetime
from database.connection import users_collection
from repositories.base_repository import BaseRepository

class UserRepository(BaseRepository):
    @staticmethod
    def _get_next_user_id():
        return BaseRepository._get_next_sequence("user_id")

    @staticmethod
    def _normalize_email(email):
        return (email or "").strip().lower()

    @staticmethod
    def _serialize_user(user):
        serialized = dict(user)
        serialized.pop("_id", None)
        serialized.pop("password", None)
        return serialized

    @classmethod
    def create_user(cls, name, email, password=None, role="user"):
        name = (name or "").strip()
        email = cls._normalize_email(email)

        if not name:
            raise ValueError("Name is required.")
        if not email:
            raise ValueError("Email is required.")

        existing_user = users_collection.find_one({"email": email}, {"_id": 0})
        if existing_user:
            return cls._serialize_user(existing_user)

        user_id = cls._get_next_user_id()
        now = datetime.utcnow().isoformat(timespec="seconds") + "Z"
        user = {
            "user_id": user_id,
            "name": name,
            "email": email,
            "password": password,
            "role": role,
            "is_active": True,
            "created_at": now,
            "updated_at": now,
            "last_login": None
        }

        users_collection.insert_one(user)
        return cls._serialize_user(user)

    @classmethod
    def list_users(cls):
        return [
            cls._serialize_user(user)
            for user in users_collection.find({}, {"_id": 0}).sort("created_at", -1)
        ]

    @classmethod
    def get_user(cls, user_id):
        user = users_collection.find_one({"user_id": int(user_id)}, {"_id": 0})
        if user is None:
            return None
        return cls._serialize_user(user)

    @classmethod
    def get_user_by_email(cls, email):
        user = users_collection.find_one({"email": cls._normalize_email(email)}, {"_id": 0})
        if user is None:
            return None
        # We might need password for authentication, so return raw user or create another method
        # Actually, for auth we need password. Let's return the dictionary directly.
        return dict(user)

    @classmethod
    def update_user(cls, user_id, update_data):
        now = datetime.utcnow().isoformat(timespec="seconds") + "Z"
        update_data["updated_at"] = now
        users_collection.update_one({"user_id": int(user_id)}, {"$set": update_data})
        return cls.get_user(user_id)

    @classmethod
    def delete_user(cls, user_id):
        users_collection.delete_one({"user_id": int(user_id)})


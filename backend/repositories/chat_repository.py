from datetime import datetime
from pymongo import ASCENDING
from database.connection import chat_messages_collection

class ChatRepository:
    @staticmethod
    def _serialize_chat_message(message):
        serialized = dict(message)
        serialized.pop("_id", None)
        return serialized

    @classmethod
    def save_chat_message(cls, user_id, user_name, role, content):
        if role not in ("user", "assistant"):
            raise ValueError("Chat role must be user or assistant.")

        content = (content or "").strip()
        if not content:
            raise ValueError("Chat message content is required.")

        message = {
            "user_id": int(user_id),
            "user_name": user_name,
            "role": role,
            "content": content,
            "created_at": datetime.utcnow().isoformat(timespec="seconds") + "Z",
        }
        chat_messages_collection.insert_one(message)
        return cls._serialize_chat_message(message)

    @classmethod
    def get_chat_history(cls, user_id):
        messages = chat_messages_collection.find(
            {"user_id": int(user_id)},
            {"_id": 0},
        ).sort("created_at", ASCENDING)

        return [cls._serialize_chat_message(message) for message in messages]

    @staticmethod
    def clear_chat_history(user_id):
        chat_messages_collection.delete_many({"user_id": int(user_id)})

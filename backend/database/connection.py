import os
from pymongo import ASCENDING, MongoClient
from pymongo.errors import PyMongoError, ServerSelectionTimeoutError

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/")
MONGO_DB_NAME = os.getenv("MONGO_DB_NAME", "portfolio_risk_analyzer")

client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
db = client[MONGO_DB_NAME]

portfolios_collection = db["portfolios"]
holdings_collection = db["portfolio_holdings"]
users_collection = db["users"]
chat_messages_collection = db["chat_messages"]
counters_collection = db["counters"]

def init_db():
    try:
        client.admin.command("ping")
        portfolios_collection.create_index([("portfolio_id", ASCENDING)], unique=True)
        portfolios_collection.create_index([("created_at", ASCENDING)])
        holdings_collection.create_index([("portfolio_id", ASCENDING)])
        users_collection.create_index([("user_id", ASCENDING)], unique=True)
        users_collection.create_index([("email", ASCENDING)], unique=True, sparse=True)
        chat_messages_collection.create_index([("user_id", ASCENDING)])
        chat_messages_collection.create_index([("created_at", ASCENDING)])
        
        counters_collection.update_one(
            {"_id": "portfolio_id"},
            {"$setOnInsert": {"sequence_value": 0}},
            upsert=True,
        )
        counters_collection.update_one(
            {"_id": "user_id"},
            {"$setOnInsert": {"sequence_value": 0}},
            upsert=True,
        )
    except ServerSelectionTimeoutError as exc:
        raise RuntimeError("MongoDB is not reachable. Check MONGO_URI and make sure MongoDB is running.") from exc
    except PyMongoError as exc:
        raise RuntimeError("MongoDB initialization failed.") from exc

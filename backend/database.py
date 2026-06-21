import os
from datetime import datetime

from pymongo import ASCENDING, MongoClient, ReturnDocument
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
        portfolios_collection.create_index(
            [("portfolio_id", ASCENDING)],
            unique=True,
        )
        portfolios_collection.create_index([("created_at", ASCENDING)])
        holdings_collection.create_index([("portfolio_id", ASCENDING)])
        users_collection.create_index(
            [("user_id", ASCENDING)],
            unique=True,
        )
        users_collection.create_index(
            [("email", ASCENDING)],
            unique=True,
            sparse=True,
        )
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


def _get_next_sequence(name):
    counter = counters_collection.find_one_and_update(
        {"_id": name},
        {"$inc": {"sequence_value": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return counter["sequence_value"]


def _get_next_portfolio_id():
    return _get_next_sequence("portfolio_id")


def _get_next_user_id():
    return _get_next_sequence("user_id")


def _normalize_email(email):
    return (email or "").strip().lower()


def _normalize_holding(holding):
    allowed_types = [
        "Stock",
        "Mutual Fund",
        "Forex",
        "Crypto",
        "F&O",
    ]

    asset_type = (
        holding.get("asset_type")
        or holding.get("assetType")
        or "Stock"
    )

    if isinstance(asset_type, str):
        asset_type = asset_type.strip()
    else:
        asset_type = "Stock"

    if asset_type.lower() == "mutual fund":
        asset_type = "Mutual Fund"
    elif asset_type.lower() == "forex":
        asset_type = "Forex"
    elif asset_type.lower() == "crypto":
        asset_type = "Crypto"
    elif asset_type.lower() in ("f&o", "fno", "futures and options"):
        asset_type = "F&O"
    elif asset_type.lower() == "stock":
        asset_type = "Stock"

    if asset_type not in allowed_types:
        asset_type = "Stock"

    symbol = (holding.get("symbol") or holding.get("fund") or holding.get("fund_name") or "").strip()
    quantity = holding.get("quantity")
    units = holding.get("units")
    investment_amount = holding.get("investment_amount") or holding.get("investmentAmount")

    if asset_type == "Mutual Fund":
        quantity = units if units not in (None, "") else quantity

    try:
        quantity = float(quantity)
    except (TypeError, ValueError):
        quantity = 0

    return {
        "asset_type": asset_type,
        "symbol": symbol.upper() if asset_type == "Stock" else symbol,
        "quantity": quantity,
        "fund_name": holding.get("fund_name") or holding.get("fundName") or symbol,
        "nav": holding.get("nav"),
        "units": units if units not in (None, "") else quantity,
        "current_value": holding.get("current_value") or holding.get("currentValue"),
        "allocation_percentage": holding.get("allocation_percentage") or holding.get("allocationPercentage"),
        "investment_amount": investment_amount,
        "strike_price": holding.get("strike_price"),
        "expiry_date": holding.get("expiry_date"),
        "option_type": holding.get("option_type"),
    }


def _serialize_holding(holding):
    serialized = dict(holding)
    serialized.pop("_id", None)
    return serialized


def _serialize_portfolio(portfolio):
    serialized = dict(portfolio)
    serialized.pop("_id", None)
    return serialized


def _serialize_user(user):
    serialized = dict(user)
    serialized.pop("_id", None)
    return serialized


def _serialize_chat_message(message):
    serialized = dict(message)
    serialized.pop("_id", None)
    return serialized


def create_user(name, email):
    name = (name or "").strip()
    email = _normalize_email(email)

    if not name:
        raise ValueError("Name is required.")

    if not email:
        raise ValueError("Email is required.")

    existing_user = users_collection.find_one({"email": email}, {"_id": 0})

    if existing_user:
        return _serialize_user(existing_user)

    user_id = _get_next_user_id()
    now = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    user = {
        "user_id": user_id,
        "name": name,
        "email": email,
        "created_at": now,
        "updated_at": now,
    }

    users_collection.insert_one(user)
    return _serialize_user(user)


def list_users():
    return [
        _serialize_user(user)
        for user in users_collection.find({}, {"_id": 0}).sort("created_at", -1)
    ]


def get_user(user_id):
    user = users_collection.find_one({"user_id": int(user_id)}, {"_id": 0})

    if user is None:
        return None

    return _serialize_user(user)


def save_chat_message(user_id, user_name, role, content):
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
    return _serialize_chat_message(message)


def get_chat_history(user_id):
    messages = chat_messages_collection.find(
        {"user_id": int(user_id)},
        {"_id": 0},
    ).sort("created_at", ASCENDING)

    return [_serialize_chat_message(message) for message in messages]


def clear_chat_history(user_id):
    chat_messages_collection.delete_many({"user_id": int(user_id)})


def save_portfolio(holdings, user=None):
    if not isinstance(holdings, list):
        raise ValueError("Holdings must be a list.")

    normalized = [_normalize_holding(item) for item in holdings]
    normalized = [item for item in normalized if item["symbol"] and item["quantity"] > 0]

    if not normalized:
        raise ValueError("At least one valid holding is required.")

    portfolio_id = _get_next_portfolio_id()
    created_at = datetime.utcnow().isoformat(timespec="seconds") + "Z"
    user = user or {}

    portfolios_collection.insert_one({
        "portfolio_id": portfolio_id,
        "created_at": created_at,
        "user_id": user.get("user_id"),
        "user_name": user.get("name"),
        "user_email": user.get("email"),
    })

    documents = []

    for index, holding in enumerate(normalized, start=1):
        documents.append({
            "id": index,
            "portfolio_id": portfolio_id,
            "user_id": user.get("user_id"),
            "user_name": user.get("name"),
            "symbol": holding["symbol"],
            "quantity": holding["quantity"],
            "asset_type": holding["asset_type"],
            "fund_name": holding["fund_name"],
            "nav": holding["nav"],
            "units": holding["units"],
            "current_value": holding["current_value"],
            "allocation_percentage": holding["allocation_percentage"],
            "investment_amount": holding.get("investment_amount"),
            "strike_price": holding.get("strike_price"),
            "expiry_date": holding.get("expiry_date"),
            "option_type": holding.get("option_type"),
        })

    holdings_collection.insert_many(documents)

    return get_portfolio(portfolio_id)


def list_portfolios(user_id=None):
    portfolios = []
    query = {}

    if user_id not in (None, ""):
        query["user_id"] = int(user_id)

    for portfolio in portfolios_collection.find(query, {"_id": 0}).sort("created_at", -1):
        portfolio_id = portfolio["portfolio_id"]
        holdings = list(holdings_collection.find({"portfolio_id": portfolio_id}, {"_id": 0}))
        stored_value = sum(float(item.get("current_value") or 0) for item in holdings)

        portfolios.append({
            **portfolio,
            "holdings_count": len(holdings),
            "stored_value": stored_value,
        })

    return portfolios


def get_portfolio(portfolio_id):
    portfolio = portfolios_collection.find_one(
        {"portfolio_id": portfolio_id},
        {"_id": 0},
    )

    if portfolio is None:
        return None

    holdings = holdings_collection.find(
        {"portfolio_id": portfolio_id},
        {"_id": 0},
    ).sort("id", ASCENDING)

    return {
        **_serialize_portfolio(portfolio),
        "holdings": [_serialize_holding(row) for row in holdings],
    }


def delete_portfolio(portfolio_id):
    result = portfolios_collection.delete_one({"portfolio_id": portfolio_id})

    if result.deleted_count == 0:
        return False

    holdings_collection.delete_many({"portfolio_id": portfolio_id})
    return True

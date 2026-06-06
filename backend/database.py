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
        counters_collection.update_one(
            {"_id": "portfolio_id"},
            {"$setOnInsert": {"sequence_value": 0}},
            upsert=True,
        )
    except ServerSelectionTimeoutError as exc:
        raise RuntimeError("MongoDB is not reachable. Check MONGO_URI and make sure MongoDB is running.") from exc
    except PyMongoError as exc:
        raise RuntimeError("MongoDB initialization failed.") from exc


def _get_next_portfolio_id():
    counter = counters_collection.find_one_and_update(
        {"_id": "portfolio_id"},
        {"$inc": {"sequence_value": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )
    return counter["sequence_value"]


def _normalize_holding(holding):
    asset_type = holding.get("asset_type") or holding.get("assetType") or "Stock"
    asset_type = "Mutual Fund" if asset_type.lower() == "mutual fund" else "Stock"

    symbol = (holding.get("symbol") or holding.get("fund") or holding.get("fund_name") or "").strip()
    quantity = holding.get("quantity")
    units = holding.get("units")

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
    }


def _serialize_holding(holding):
    serialized = dict(holding)
    serialized.pop("_id", None)
    return serialized


def _serialize_portfolio(portfolio):
    serialized = dict(portfolio)
    serialized.pop("_id", None)
    return serialized


def save_portfolio(holdings):
    if not isinstance(holdings, list):
        raise ValueError("Holdings must be a list.")

    normalized = [_normalize_holding(item) for item in holdings]
    normalized = [item for item in normalized if item["symbol"] and item["quantity"] > 0]

    if not normalized:
        raise ValueError("At least one valid holding is required.")

    portfolio_id = _get_next_portfolio_id()
    created_at = datetime.utcnow().isoformat(timespec="seconds") + "Z"

    portfolios_collection.insert_one({
        "portfolio_id": portfolio_id,
        "created_at": created_at,
    })

    documents = []

    for index, holding in enumerate(normalized, start=1):
        documents.append({
            "id": index,
            "portfolio_id": portfolio_id,
            "symbol": holding["symbol"],
            "quantity": holding["quantity"],
            "asset_type": holding["asset_type"],
            "fund_name": holding["fund_name"],
            "nav": holding["nav"],
            "units": holding["units"],
            "current_value": holding["current_value"],
            "allocation_percentage": holding["allocation_percentage"],
        })

    holdings_collection.insert_many(documents)

    return get_portfolio(portfolio_id)


def list_portfolios():
    portfolios = []

    for portfolio in portfolios_collection.find({}, {"_id": 0}).sort("created_at", -1):
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

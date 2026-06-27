from datetime import datetime
from pymongo import ASCENDING
from database.connection import portfolios_collection, holdings_collection
from repositories.base_repository import BaseRepository

class PortfolioRepository(BaseRepository):
    @staticmethod
    def _get_next_portfolio_id():
        return BaseRepository._get_next_sequence("portfolio_id")

    @staticmethod
    def _serialize_holding(holding):
        serialized = dict(holding)
        serialized.pop("_id", None)
        return serialized

    @staticmethod
    def _serialize_portfolio(portfolio):
        serialized = dict(portfolio)
        serialized.pop("_id", None)
        return serialized

    @staticmethod
    def _normalize_holding(holding):
        allowed_types = ["Stock", "Mutual Fund", "Forex", "Crypto", "F&O"]

        asset_type = holding.get("asset_type") or holding.get("assetType") or "Stock"
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

    @classmethod
    def save_portfolio(cls, holdings, user=None):
        if not isinstance(holdings, list):
            raise ValueError("Holdings must be a list.")

        normalized = [cls._normalize_holding(item) for item in holdings]
        normalized = [item for item in normalized if item["symbol"] and item["quantity"] > 0]

        if not normalized:
            raise ValueError("At least one valid holding is required.")

        portfolio_id = cls._get_next_portfolio_id()
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
        return cls.get_portfolio(portfolio_id)

    @classmethod
    def list_portfolios(cls, user_id=None):
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

    @classmethod
    def get_portfolio(cls, portfolio_id):
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
            **cls._serialize_portfolio(portfolio),
            "holdings": [cls._serialize_holding(row) for row in holdings],
        }

    @staticmethod
    def delete_portfolio(portfolio_id):
        result = portfolios_collection.delete_one({"portfolio_id": portfolio_id})
        if result.deleted_count == 0:
            return False

        holdings_collection.delete_many({"portfolio_id": portfolio_id})
        return True

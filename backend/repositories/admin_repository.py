from database.connection import users_collection, portfolios_collection
from datetime import datetime, timedelta
from utils import DB_READY

class AdminRepository:
    @staticmethod
    def get_dashboard_stats():
        if not DB_READY:
            return {}

        total_users = users_collection.count_documents({})
        active_users = users_collection.count_documents({"is_active": True})
        total_portfolios = portfolios_collection.count_documents({})
        
        # Count today's portfolios
        today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        today_iso = today_start.isoformat() + "Z"
        todays_portfolios = portfolios_collection.count_documents({"created_at": {"$gte": today_iso}})

        # This could be more sophisticated if risk reports were stored separately,
        # but we'll assume every portfolio implies a risk report for now.
        total_risk_reports = total_portfolios 

        return {
            "total_users": total_users,
            "active_users": active_users,
            "total_portfolios": total_portfolios,
            "todays_portfolio_analyses": todays_portfolios,
            "total_risk_reports": total_risk_reports
        }

    @staticmethod
    def get_analytics():
        if not DB_READY:
            return {}

        # Mocking monthly and daily trends since we might not have enough historical data
        # We can aggregate from users and portfolios if needed
        # For simplicity in this demo, let's use a quick aggregation or return dummy shape.
        return {
            "daily_users": [],
            "portfolio_growth": [],
            "risk_distribution": [],
            "most_used_assets": []
        }

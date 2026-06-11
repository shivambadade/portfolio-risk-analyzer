import yfinance as yf
from forex import get_forex_data
from crypto import get_crypto_data

def get_stock_data(symbol):
    try:
        stock = yf.Ticker(symbol)
        data = stock.history(period="1d")

        if data.empty:
            return None

        latest_price = round(data["Close"].iloc[-1], 2)

        return {
            "symbol": symbol,
            "latest_price": latest_price,
        }

    except Exception:
        return None


def get_stock_history(symbol):
    try:
        stock = yf.Ticker(symbol)
        data = stock.history(period="7d")
        history = []

        for index, row in data.iterrows():
            history.append({
                "date": index.strftime("%Y-%m-%d"),
                "close": round(row["Close"], 2),
            })

        return history

    except Exception:
        return []


def calculate_volatility(symbol):
    try:
        stock = yf.Ticker(symbol)
        data = stock.history(period="1mo")

        if data.empty:
            return 0

        returns = data["Close"].pct_change()
        volatility = returns.std()

        return round(volatility * 100, 2)

    except Exception:
        return 0


def classify_risk(volatility):
    if volatility >= 3:
        return "High Risk"

    if volatility >= 1.5:
        return "Moderate Risk"

    return "Low Risk"


def get_mutual_fund_data(fund):
    try:
        ticker = yf.Ticker(fund)
        data = ticker.history(period="1d")

        if data.empty:
            return None

        nav = round(data["Close"].iloc[-1], 2)
        info = ticker.info or {}

        return {
            "fund": fund,
            "fund_name": info.get("longName") or info.get("shortName") or fund,
            "nav": nav,
        }

    except Exception:
        return None


def get_mutual_fund_history(fund):
    try:
        ticker = yf.Ticker(fund)
        data = ticker.history(period="1mo")
        history = []

        for index, row in data.iterrows():
            history.append({
                "date": index.strftime("%Y-%m-%d"),
                "nav": round(row["Close"], 2),
            })

        return history

    except Exception:
        return []


def normalize_portfolio(portfolio):
    if isinstance(portfolio, dict):
        if "holdings" in portfolio and isinstance(portfolio["holdings"], list):
            portfolio = portfolio["holdings"]
        elif "portfolio" in portfolio and isinstance(portfolio["portfolio"], list):
            portfolio = portfolio["portfolio"]
        else:
            return [
                {
                    "asset_type": "Stock",
                    "symbol": symbol,
                    "quantity": quantity,
                }
                for symbol, quantity in portfolio.items()
            ]

    if not isinstance(portfolio, list):
        return []

    normalized = []

    for item in portfolio:
        raw_type = (item.get("asset_type") or item.get("assetType") or "").strip()
        raw_type_lower = raw_type.lower()

        if "mutual" in raw_type_lower:
            asset_type = "Mutual Fund"
        elif "forex" in raw_type_lower or raw_type_lower == "fx":
            asset_type = "Forex"
        elif "crypto" in raw_type_lower or "coin" in raw_type_lower or "crypto" in raw_type_lower:
            asset_type = "Crypto"
        elif "stock" in raw_type_lower or "equity" in raw_type_lower:
            asset_type = "Stock"
        else:
            # Try to infer from symbol if not provided
            possible_symbol = (item.get("symbol") or item.get("fund") or "").strip()
            ps = possible_symbol.upper()
            if ps.endswith("=X") or "/" in ps:
                asset_type = "Forex"
            elif "-" in ps and any(c.isalpha() for c in ps):
                asset_type = "Crypto"
            else:
                asset_type = "Stock"

        symbol = (item.get("symbol") or item.get("fund") or item.get("fund_name") or "").strip()
        quantity = item.get("quantity")
        units = item.get("units")

        if asset_type == "Mutual Fund":
            quantity = units if units not in (None, "") else quantity

        try:
            # allow quantities like "1,000"
            if isinstance(quantity, str):
                numeric_quantity = float(quantity.replace(",", ""))
            else:
                numeric_quantity = float(quantity)
        except (TypeError, ValueError):
            numeric_quantity = 0

        if not symbol or numeric_quantity <= 0:
            continue

        normalized.append({
            "asset_type": asset_type,
            "symbol": symbol.upper() if asset_type == "Stock" else symbol,
            "quantity": numeric_quantity,
            "fund_name": item.get("fund_name") or item.get("fundName") or symbol,
        })

    return normalized


def analyze_portfolio(portfolio):
    holdings = normalize_portfolio(portfolio)
    portfolio_details = []
    stock_details = []
    mutual_fund_details = []
    total_value = 0

    for holding in holdings:
        if holding["asset_type"] == "Mutual Fund":
            fund_data = get_mutual_fund_data(holding["symbol"])

            if fund_data is None:
                continue

            volatility = calculate_volatility(holding["symbol"])
            current_value = fund_data["nav"] * holding["quantity"]
            detail = {
                "asset_type": "Mutual Fund",
                "symbol": holding["symbol"],
                "fund_name": fund_data["fund_name"],
                "nav": fund_data["nav"],
                "units": holding["quantity"],
                "quantity": holding["quantity"],
                "current_value": round(current_value, 2),
                "investment_value": round(current_value, 2),
                "volatility": volatility,
                "risk_classification": classify_risk(volatility),
            }

            mutual_fund_details.append(detail)
            portfolio_details.append(detail)
            total_value += current_value
            continue

        if holding["asset_type"] == "Forex":
            forex_data = get_forex_data(holding["symbol"])

            if "error" in forex_data:
                continue

            current_value = forex_data["rate"] * holding["quantity"]
            detail = {
                "asset_type": "Forex",
                "symbol": holding["symbol"],
                "rate": forex_data["rate"],
                "quantity": holding["quantity"],
                "investment_value": round(current_value, 2),
                "current_value": round(current_value, 2),
                "volatility": 5,
            }

            portfolio_details.append(detail)
            total_value += current_value
            continue

        if holding["asset_type"] == "Crypto":
            crypto_data = get_crypto_data(holding["symbol"])

            if "error" in crypto_data:
                continue

            current_value = crypto_data["price"] * holding["quantity"]
            detail = {
                "asset_type": "Crypto",
                "symbol": holding["symbol"],
                "latest_price": crypto_data["price"],
                "quantity": holding["quantity"],
                "investment_value": round(current_value, 2),
                "current_value": round(current_value, 2),
                "volatility": 25,
            }

            portfolio_details.append(detail)
            total_value += current_value
            continue

        stock_data = get_stock_data(holding["symbol"])

        if stock_data is None:
            continue

        volatility = calculate_volatility(holding["symbol"])
        investment_value = stock_data["latest_price"] * holding["quantity"]
        detail = {
            "asset_type": "Stock",
            "symbol": holding["symbol"],
            "quantity": holding["quantity"],
            "latest_price": stock_data["latest_price"],
            "volatility": volatility,
            "investment_value": round(investment_value, 2),
            "current_value": round(investment_value, 2),
        }

        stock_details.append(detail)
        portfolio_details.append(detail)
        total_value += investment_value

    if total_value == 0:
        return {
            "error": "No valid stock symbols or mutual funds found.",
        }

    highest_allocation = 0
    top_risk_asset = ""

    for holding in portfolio_details:
        allocation = (holding["investment_value"] / total_value) * 100
        holding["allocation_percentage"] = round(allocation, 2)

        if allocation > highest_allocation:
            highest_allocation = allocation
            top_risk_asset = holding["fund_name"] if holding["asset_type"] == "Mutual Fund" else holding["symbol"]

    average_volatility = sum(holding["volatility"] for holding in portfolio_details) / len(portfolio_details)
    risk_score = round(average_volatility * 10, 2)

    if highest_allocation > 50:
        diversification = "Poor"
    elif highest_allocation > 30:
        diversification = "Moderate"
    else:
        diversification = "Good"

    health_score = 100

    if risk_score > 40:
        health_score -= 30
    elif risk_score > 20:
        health_score -= 15

    if diversification == "Poor":
        health_score -= 30
    elif diversification == "Moderate":
        health_score -= 10

    if any(item.get("risk_classification") == "High Risk" for item in mutual_fund_details):
        health_score -= 10

    health_score = max(0, min(100, health_score))

    return {
        "total_portfolio_value": round(total_value, 2),
        "risk_score": risk_score,
        "top_risk_stock": top_risk_asset,
        "top_risk_asset": top_risk_asset,
        "diversification": diversification,
        "health_score": health_score,
        "stocks": stock_details,
        "mutual_funds": mutual_fund_details,
        "assets": portfolio_details,
    }


def generate_ai_insights(portfolio_result):
    if "error" in portfolio_result:
        return [portfolio_result["error"]]

    insights = []

    if portfolio_result["risk_score"] > 30:
        insights.append("Your portfolio has high volatility risk.")
    else:
        insights.append("Your portfolio risk is relatively balanced.")

    if portfolio_result["diversification"] == "Poor":
        insights.append("Your portfolio is highly concentrated in a few assets.")
    elif portfolio_result["diversification"] == "Moderate":
        insights.append("Your portfolio has moderate diversification.")
    else:
        insights.append("Your portfolio is well diversified.")

    if portfolio_result.get("mutual_funds"):
        high_risk_funds = [
            fund["fund_name"]
            for fund in portfolio_result["mutual_funds"]
            if fund["risk_classification"] == "High Risk"
        ]

        if high_risk_funds:
            insights.append("Some mutual funds carry high risk: " + ", ".join(high_risk_funds) + ".")
        else:
            insights.append("Your mutual fund exposure is not classified as high risk.")

    insights.append(f"Highest portfolio exposure is in {portfolio_result['top_risk_asset']}.")

    return insights


def generate_recommendations(portfolio_result):
    if "error" in portfolio_result:
        return [portfolio_result["error"]]

    recommendations = []

    if portfolio_result["risk_score"] > 40:
        recommendations.append("Consider reducing exposure to highly volatile assets.")

    if portfolio_result["diversification"] == "Poor":
        recommendations.append("Your portfolio is concentrated. Add assets from different sectors or fund categories.")
    elif portfolio_result["diversification"] == "Moderate":
        recommendations.append("Consider increasing diversification for better risk management.")

    for fund in portfolio_result.get("mutual_funds", []):
        if fund["risk_classification"] == "High Risk":
            recommendations.append(f"Review the allocation to {fund['fund_name']} because it is classified as High Risk.")

    recommendations.append(f"Review your allocation in {portfolio_result['top_risk_asset']}.")

    return recommendations

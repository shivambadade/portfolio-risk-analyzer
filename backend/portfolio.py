import yfinance as yf

def get_stock_data(symbol):

    stock = yf.Ticker(symbol)

    data = stock.history(period="5d")

    latest_close = data['Close'].iloc[-1]

    return {
        "symbol": symbol,
        "latest_price": round(latest_close, 2)
    }


def analyze_portfolio(portfolio):

    total_value = 0

    stock_details = []

    # First calculate investment values

    for symbol, quantity in portfolio.items():

        stock = yf.Ticker(symbol)

        data = stock.history(period="5d")

        latest_price = data['Close'].iloc[-1]

        investment_value = latest_price * quantity

        total_value += investment_value

        stock_details.append({
            "symbol": symbol,
            "quantity": quantity,
            "latest_price": round(latest_price, 2),
            "investment_value": round(investment_value, 2)
        })

    # Calculate allocation percentages

    highest_allocation = 0
    top_stock = ""

    for stock in stock_details:

        allocation = (stock["investment_value"] / total_value) * 100

        stock["allocation_percentage"] = round(allocation, 2)

        if allocation > highest_allocation:
            highest_allocation = allocation
            top_stock = stock["symbol"]

    # Diversification logic

    if highest_allocation > 50:
        diversification = "Poor"
        risk_score = 85

    elif highest_allocation > 30:
        diversification = "Moderate"
        risk_score = 60

    else:
        diversification = "Good"
        risk_score = 35

    return {
        "total_portfolio_value": round(total_value, 2),
        "risk_score": risk_score,
        "top_risk_stock": top_stock,
        "diversification": diversification,
        "stocks": stock_details
    }
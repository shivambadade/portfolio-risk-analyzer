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

    return {
        "total_portfolio_value": round(total_value, 2),
        "stocks": stock_details
    }
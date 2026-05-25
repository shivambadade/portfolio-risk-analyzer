import yfinance as yf

def get_stock_data(symbol):
    stock = yf.Ticker(symbol)

    data = stock.history(period="5d")

    latest_close = data['Close'].iloc[-1]

    return {
        "symbol": symbol,
        "latest_price": round(latest_close, 2)
    }
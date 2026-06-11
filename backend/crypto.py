import yfinance as yf


def get_crypto_data(symbol):

    try:

        ticker = yf.Ticker(symbol)

        hist = ticker.history(period="1d")

        return {
            "symbol": symbol,
            "price": round(
                float(hist["Close"].iloc[-1]),
                2
            )
        }

    except Exception:

        return {
            "error": "Unable to fetch crypto data"
        }
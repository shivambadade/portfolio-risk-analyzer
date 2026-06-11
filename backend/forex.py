import yfinance as yf


def get_forex_data(pair):

    try:

        ticker = yf.Ticker(pair)

        hist = ticker.history(period="1d")

        return {
            "pair": pair,
            "rate": round(
                float(hist["Close"].iloc[-1]),
                4
            )
        }

    except Exception:

        return {
            "error": "Unable to fetch forex data"
        }
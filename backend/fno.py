import yfinance as yf


def get_option_chain(symbol):

    try:

        stock = yf.Ticker(symbol)

        expirations = stock.options

        if not expirations:

            return {
                "error": "No options data available"
            }

        expiry = expirations[0]

        chain = stock.option_chain(expiry)

        return {
            "symbol": symbol,
            "expiration": expiry,
            "calls_count": len(chain.calls),
            "puts_count": len(chain.puts)
        }

    except Exception as e:

        return {
            "error": str(e)
        }
    
    
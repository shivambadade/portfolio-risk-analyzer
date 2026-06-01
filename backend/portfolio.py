import yfinance as yf


# Fetch latest stock price

def get_stock_data(symbol):

    try:

        stock = yf.Ticker(symbol)

        data = stock.history(period="1d")

        if data.empty:

            return None

        latest_price = round(
            data['Close'].iloc[-1],
            2
        )

        return {

            "symbol": symbol,

            "latest_price": latest_price
        }

    except:

        return None


# Historical stock data

def get_stock_history(symbol):

    try:

        stock = yf.Ticker(symbol)

        data = stock.history(period="7d")

        history = []

        for index, row in data.iterrows():

            history.append({

                "date": index.strftime("%Y-%m-%d"),

                "close": round(
                    row["Close"],
                    2
                )
            })

        return history

    except:

        return []


# Volatility calculation

def calculate_volatility(symbol):

    try:

        stock = yf.Ticker(symbol)

        data = stock.history(period="1mo")

        returns = data['Close'].pct_change()

        volatility = returns.std()

        return round(
            volatility * 100,
            2
        )

    except:

        return 0


# Portfolio analysis

def analyze_portfolio(portfolio):

    portfolio_details = []

    total_value = 0

    for symbol, quantity in portfolio.items():

        stock_data = get_stock_data(symbol)

        if stock_data is None:

            continue

        volatility = calculate_volatility(symbol)

        investment_value = (
            stock_data["latest_price"] * quantity
        )

        portfolio_details.append({

            "symbol": symbol,

            "quantity": quantity,

            "latest_price": stock_data["latest_price"],

            "volatility": volatility,

            "investment_value": round(
                investment_value,
                2
            )
        })

        total_value += investment_value

    if total_value == 0:

        return {
            "error": "No valid stock symbols found."
        }

    highest_allocation = 0

    top_risk_stock = ""

    for stock in portfolio_details:

        allocation = (
            stock["investment_value"] / total_value
        ) * 100

        stock["allocation_percentage"] = round(
            allocation,
            2
        )

        if allocation > highest_allocation:

            highest_allocation = allocation

            top_risk_stock = stock["symbol"]

    # Average volatility

    average_volatility = sum(

        stock["volatility"]

        for stock in portfolio_details

    ) / len(portfolio_details)

    risk_score = round(
        average_volatility * 10,
        2
    )


    # Diversification logic

    if highest_allocation > 50:

        diversification = "Poor"

    elif highest_allocation > 30:

        diversification = "Moderate"

    else:

        diversification = "Good"

    # Portfolio Health Score
    health_score = 100

    if risk_score > 40:
        health_score -= 30

    if diversification == "Poor":
        health_score -= 30

    elif diversification == "Moderate":
        health_score -= 10

    health_score = max(
        0,
        min(100, health_score)
    )
    return {

    "total_portfolio_value": round(
        total_value,
        2
    ),

    "risk_score": risk_score,

    "top_risk_stock": top_risk_stock,

    "diversification": diversification,

    "health_score": health_score,

    "stocks": portfolio_details
}

        # Portfolio Health Score

    health_score = 100

    # Penalize high risk

    if risk_score > 40:

        health_score -= 30

    elif risk_score > 20:

        health_score -= 15

    # Penalize concentration

    if diversification == "Poor":

        health_score -= 20

    elif diversification == "Moderate":

        health_score -= 10

    health_score = max(0, health_score)

def generate_ai_insights(portfolio_result):

    insights = []

    # Risk analysis

    if portfolio_result["risk_score"] > 30:

        insights.append(

            "Your portfolio has high volatility risk."
        )

    else:

        insights.append(

            "Your portfolio risk is relatively balanced."
        )

    # Diversification analysis

    if (
        portfolio_result["diversification"]
        == "Poor"
    ):

        insights.append(

            "Your portfolio is highly concentrated in a few stocks."
        )

    elif (
        portfolio_result["diversification"]
        == "Moderate"
    ):

        insights.append(

            "Your portfolio has moderate diversification."
        )

    else:

        insights.append(

            "Your portfolio is well diversified."
        )

    # Top risk stock

    insights.append(

        f"Highest portfolio exposure is in {portfolio_result['top_risk_stock']}."
    )

    return insights

def generate_recommendations(portfolio_result):

    recommendations = []

    if portfolio_result["risk_score"] > 40:

        recommendations.append(
            "Consider reducing exposure to highly volatile stocks."
        )

    if portfolio_result["diversification"] == "Poor":

        recommendations.append(
            "Your portfolio is concentrated. Add stocks from different sectors."
        )

    elif portfolio_result["diversification"] == "Moderate":

        recommendations.append(
            "Consider increasing diversification for better risk management."
        )

    recommendations.append(
        f"Review your allocation in {portfolio_result['top_risk_stock']}."
    )

    return recommendations
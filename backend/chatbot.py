def get_financial_advice(
    question,
    portfolio_analysis
):

    question = question.lower()

    risk_score = portfolio_analysis.get(
        "risk_score",
        0
    )

    diversification = portfolio_analysis.get(
        "diversification",
        "Unknown"
    )

    top_risk_stock = portfolio_analysis.get(
        "top_risk_stock",
        "Unknown"
    )

    total_value = portfolio_analysis.get(
        "total_portfolio_value",
        0
    )

    if "diversified" in question:

        return (
            f"Your portfolio diversification is "
            f"{diversification}. "
            f"Consider adding stocks from different sectors "
            f"to reduce concentration risk."
        )

    elif "risk" in question:

        return (
            f"Portfolio Risk Score: {risk_score}. "
            f"The riskiest stock currently appears to be "
            f"{top_risk_stock}."
        )

    elif "value" in question:

        return (
            f"Your portfolio value is "
            f"₹{total_value:.2f}."
        )

    elif "buy" in question:

        return (
            "Consider adding stocks from sectors "
            "that are currently underrepresented "
            "in your portfolio."
        )

    elif "sell" in question:

        return (
            f"You may want to review "
            f"{top_risk_stock} due to its higher volatility."
        )

    else:

        return (
            "Your portfolio has been analyzed successfully. "
            "Ask about risk, diversification, value, buy, or sell suggestions."
        )
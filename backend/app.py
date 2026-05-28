from dotenv import load_dotenv

load_dotenv()

from chatbot import get_financial_advice

from flask import Flask, jsonify, request

from flask_cors import CORS

from portfolio import (
    get_stock_data,
    analyze_portfolio,
    get_stock_history,
    generate_ai_insights
)

import os


app = Flask(__name__)

CORS(app)

PORT = os.getenv("PORT", 5000)


@app.route('/')
def home():

    return {
        "message": "Portfolio Risk Analyzer Backend Running"
    }


@app.route('/stock/<symbol>')
def stock(symbol):

    data = get_stock_data(symbol.upper())

    return jsonify(data)


@app.route('/history/<symbol>')
def history(symbol):

    data = get_stock_history(symbol.upper())

    return jsonify(data)


@app.route('/portfolio', methods=['POST'])
def portfolio():

    portfolio_data = request.json

    result = analyze_portfolio(portfolio_data)

    return jsonify(result)


@app.route('/ai-insights', methods=['POST'])
def ai_insights():

    portfolio_data = request.json

    result = analyze_portfolio(
        portfolio_data
    )

    insights = generate_ai_insights(
        result
    )

    return jsonify({
        "insights": insights
    })


@app.route('/chatbot', methods=['POST'])
def chatbot():

    data = request.json

    question = data.get("question")

    portfolio_data = data.get("portfolio")

    portfolio_analysis = analyze_portfolio(
        portfolio_data
    )

    response = get_financial_advice(
        question,
        portfolio_analysis
    )

    return jsonify({
        "response": response
    })


if __name__ == '__main__':

    app.run(
        debug=True,
        port=int(PORT)
    )
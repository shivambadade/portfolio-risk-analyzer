from flask import Flask, jsonify, request
from flask_cors import CORS

from portfolio import (
    get_stock_data,
    analyze_portfolio,
    get_stock_history
)

from dotenv import load_dotenv
import os

load_dotenv()

app = Flask(__name__)

CORS(app)

PORT = os.getenv("PORT", 5000)


# Home Route

@app.route('/')
def home():

    return {
        "message": "Portfolio Risk Analyzer Backend Running"
    }


# Latest Stock Price Route

@app.route('/stock/<symbol>')
def stock(symbol):

    data = get_stock_data(symbol.upper())

    return jsonify(data)


# Historical Stock Data Route

@app.route('/history/<symbol>')
def history(symbol):

    data = get_stock_history(symbol.upper())

    return jsonify(data)


# Portfolio Analysis Route

@app.route('/portfolio', methods=['POST'])
def portfolio():

    portfolio_data = request.json

    result = analyze_portfolio(portfolio_data)

    return jsonify(result)


if __name__ == '__main__':

    app.run(
        debug=True,
        port=int(PORT)
    )
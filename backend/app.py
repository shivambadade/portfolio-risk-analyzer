from flask import Flask, jsonify, request
from flask_cors import CORS
from portfolio import get_stock_data, analyze_portfolio

from dotenv import load_dotenv
import os

load_dotenv()

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


@app.route('/portfolio')
def portfolio():

    sample_portfolio = {
        "AAPL": 5,
        "TSLA": 2,
        "TCS.NS": 10
    }

    result = analyze_portfolio(sample_portfolio)

    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True, port=int(PORT))
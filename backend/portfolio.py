from flask import Flask, jsonify, request
from flask_cors import CORS
from portfolio import get_stock_data, analyze_portfolio

app = Flask(__name__)

CORS(app)


@app.route('/')
def home():

    return {
        "message": "Portfolio Risk Analyzer Backend Running"
    }


@app.route('/stock/<symbol>')
def stock(symbol):

    data = get_stock_data(symbol.upper())

    return jsonify(data)


@app.route('/portfolio', methods=['POST'])
def portfolio():

    portfolio_data = request.json

    result = analyze_portfolio(portfolio_data)

    return jsonify(result)


if __name__ == '__main__':
    app.run(debug=True)
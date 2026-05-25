from flask import Flask, jsonify
from portfolio import get_stock_data, analyze_portfolio

app = Flask(__name__)

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
    app.run(debug=True)
from flask import Flask, jsonify
from portfolio import get_stock_data

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

if __name__ == '__main__':
    app.run(debug=True)
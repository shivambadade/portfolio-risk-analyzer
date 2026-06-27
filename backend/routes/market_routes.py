from flask import Blueprint, jsonify
from portfolio import get_stock_data, get_stock_history, get_mutual_fund_history
from forex import get_forex_data
from crypto import get_crypto_data
from fno import get_option_chain
from utils import error_response

market_routes = Blueprint("market", __name__)

@market_routes.route("/stock/<symbol>")
def stock(symbol):
    data = get_stock_data(symbol.upper())
    if data is None:
        return error_response("Stock symbol not found.", 404)
    return jsonify(data)

@market_routes.route("/history/<symbol>")
def history(symbol):
    return jsonify(get_stock_history(symbol.upper()))

@market_routes.route("/mutual-fund-history/<fund>")
def mutual_fund_history(fund):
    return jsonify(get_mutual_fund_history(fund))

@market_routes.route("/forex/<pair>")
def forex(pair):
    return jsonify(get_forex_data(pair))

@market_routes.route("/crypto/<symbol>")
def crypto(symbol):
    return jsonify(get_crypto_data(symbol))

@market_routes.route("/options/<symbol>")
def options(symbol):
    return jsonify(get_option_chain(symbol.upper()))

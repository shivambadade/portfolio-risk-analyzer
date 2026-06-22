from dotenv import load_dotenv
from forex import get_forex_data
from crypto import get_crypto_data
from fno import get_option_chain

load_dotenv()

import os

from chatbot import get_financial_advice
from database import (
    clear_chat_history,
    create_user,
    delete_portfolio,
    get_chat_history,
    get_portfolio,
    get_user,
    init_db,
    list_portfolios,
    list_users,
    save_chat_message,
    save_portfolio,
)
from flask import Flask, jsonify, request
from flask_cors import CORS
from portfolio import (
    analyze_portfolio,
    generate_ai_insights,
    generate_recommendations,
    get_mutual_fund_history,
    get_stock_data,
    get_stock_history,
    normalize_portfolio,
)


app = Flask(__name__)
CORS(app)
PORT = os.getenv("PORT", 5000)

DB_READY = True
DB_ERROR = None

try:
    init_db()
except RuntimeError as exc:
    DB_READY = False
    DB_ERROR = str(exc)


def error_response(message, status_code=400):
    return jsonify({"error": message}), status_code


def database_unavailable_response():
    return error_response(DB_ERROR or "Database is unavailable.", 503)


@app.route("/")
def home():
    return {
        "message": "Portfolio Risk Analyzer Backend Running",
        "database": "MongoDB",
        "database_connected": DB_READY,
    }


@app.route("/stock/<symbol>")
def stock(symbol):
    data = get_stock_data(symbol.upper())

    if data is None:
        return error_response("Stock symbol not found.", 404)

    return jsonify(data)


@app.route("/history/<symbol>")
def history(symbol):
    return jsonify(get_stock_history(symbol.upper()))


@app.route("/mutual-fund-history/<fund>")
def mutual_fund_history(fund):
    return jsonify(get_mutual_fund_history(fund))


@app.route("/users", methods=["POST"])
def create_user_endpoint():
    if not DB_READY:
        return database_unavailable_response()

    data = request.get_json(silent=True) or {}

    try:
        user = create_user(
            data.get("name"),
            data.get("email"),
        )
    except ValueError as exc:
        return error_response(str(exc), 422)
    except Exception:
        return error_response("Unable to save user.", 500)

    return jsonify({
        "message": "User saved successfully.",
        "user": user,
    }), 201


@app.route("/users", methods=["GET"])
def users_endpoint():
    if not DB_READY:
        return database_unavailable_response()

    try:
        return jsonify({
            "users": list_users(),
        })
    except Exception:
        return error_response("Unable to load users.", 500)


@app.route("/user/<int:user_id>", methods=["GET"])
def user_endpoint(user_id):
    if not DB_READY:
        return database_unavailable_response()

    user = get_user(user_id)

    if user is None:
        return error_response("User not found.", 404)

    return jsonify(user)


@app.route("/chat-history/<int:user_id>", methods=["GET"])
def chat_history_endpoint(user_id):
    if not DB_READY:
        return database_unavailable_response()

    try:
        return jsonify({
            "messages": get_chat_history(user_id),
        })
    except Exception:
        return error_response("Unable to load chat history.", 500)


@app.route("/chat-history/<int:user_id>", methods=["DELETE"])
def clear_chat_history_endpoint(user_id):
    if not DB_READY:
        return database_unavailable_response()

    try:
        clear_chat_history(user_id)
    except Exception:
        return error_response("Unable to clear chat history.", 500)

    return jsonify({
        "message": "Chat history cleared.",
        "user_id": user_id,
    })


@app.route("/portfolio", methods=["POST"])
def portfolio():
    portfolio_data = request.get_json(silent=True)

    if portfolio_data is None:
        return error_response("Request body must be valid JSON.")

    result = analyze_portfolio(portfolio_data)

    if "error" in result:
        return error_response(result["error"], 422)

    return jsonify(result)


@app.route("/save-portfolio", methods=["POST"])
def save_portfolio_endpoint():
    if not DB_READY:
        return database_unavailable_response()

    data = request.get_json(silent=True)

    if data is None:
        return error_response("Request body must be valid JSON.")

    holdings = data.get("holdings") if isinstance(data, dict) else data
    holdings = normalize_portfolio(holdings)
    user = data.get("user") if isinstance(data, dict) else None

    try:
        saved = save_portfolio(holdings, user)
    except ValueError as exc:
        return error_response(str(exc), 422)
    except Exception:
        return error_response("Unable to save portfolio.", 500)

    return jsonify({
        "message": "Portfolio saved successfully.",
        "portfolio": saved,
    }), 201


@app.route("/portfolios", methods=["GET"])
def portfolios():
    if not DB_READY:
        return database_unavailable_response()

    try:
        return jsonify({
            "portfolios": list_portfolios(request.args.get("user_id")),
        })
    except Exception:
        return error_response("Unable to load saved portfolios.", 500)


@app.route("/portfolio/<int:portfolio_id>", methods=["GET"])
def get_saved_portfolio(portfolio_id):
    if not DB_READY:
        return database_unavailable_response()

    try:
        saved = get_portfolio(portfolio_id)
    except Exception:
        return error_response("Unable to load portfolio.", 500)

    if saved is None:
        return error_response("Portfolio not found.", 404)

    return jsonify(saved)


@app.route("/portfolio/<int:portfolio_id>", methods=["DELETE"])
def delete_saved_portfolio(portfolio_id):
    if not DB_READY:
        return database_unavailable_response()

    try:
        deleted = delete_portfolio(portfolio_id)
    except Exception:
        return error_response("Unable to delete portfolio.", 500)

    if not deleted:
        return error_response("Portfolio not found.", 404)

    return jsonify({
        "message": "Portfolio deleted successfully.",
        "portfolio_id": portfolio_id,
    })


@app.route("/ai-insights", methods=["POST"])
def ai_insights():
    portfolio_data = request.get_json(silent=True)

    if portfolio_data is None:
        return error_response("Request body must be valid JSON.")

    result = analyze_portfolio(portfolio_data)
    insights = generate_ai_insights(result)

    return jsonify({
        "insights": insights,
    })


@app.route("/chatbot", methods=["POST"])
def chatbot():
    data = request.get_json(silent=True) or {}
    question = data.get("question")
    portfolio_data = data.get("portfolio")
    conversation_messages = data.get("messages", [])
    user = data.get("user") or {}

    if not question:
        return error_response("Question is required.")

    if not DB_READY:
        return database_unavailable_response()

    user_id = user.get("user_id")
    user_name = user.get("name")

    if not user_id or not user_name:
        return error_response("Please save your name and email before using chat.", 422)

    portfolio_analysis = analyze_portfolio(portfolio_data)
    response = get_financial_advice(question, portfolio_analysis, conversation_messages)

    try:
        save_chat_message(user_id, user_name, "user", question)
        save_chat_message(user_id, user_name, "assistant", response)
    except Exception:
        return error_response("Unable to save chat history.", 500)

    return jsonify({
        "response": response,
        "messages": get_chat_history(user_id),
    })


@app.route("/recommendations", methods=["POST"])
def recommendations():
    portfolio_data = request.get_json(silent=True)

    if portfolio_data is None:
        return error_response("Request body must be valid JSON.")

    result = analyze_portfolio(portfolio_data)
    recommendations_result = generate_recommendations(result)

    return jsonify({
        "recommendations": recommendations_result,
    })


@app.route("/compare-portfolios", methods=["POST"])
def compare_portfolios():
    data = request.get_json(silent=True) or {}
    portfolio_a = data.get("portfolioA")
    portfolio_b = data.get("portfolioB")

    if portfolio_a is None or portfolio_b is None:
        return error_response("portfolioA and portfolioB are required.")

    result_a = analyze_portfolio(portfolio_a)
    result_b = analyze_portfolio(portfolio_b)

    return jsonify({
        "portfolioA": result_a,
        "portfolioB": result_b,
    })

@app.route("/forex/<pair>")
def forex(pair):

    return jsonify(
        get_forex_data(pair)
    )

@app.route("/crypto/<symbol>")
def crypto(symbol):

    return jsonify(
        get_crypto_data(symbol)
    )

@app.route("/options/<symbol>")
def options(symbol):

    return jsonify(
        get_option_chain(
            symbol.upper()
        )
    )

if __name__ == "__main__":
    app.run(
        debug=True,
        port=int(PORT),
    )

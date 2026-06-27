from flask import Blueprint, jsonify, request
from repositories.portfolio_repository import PortfolioRepository
from portfolio import analyze_portfolio, generate_ai_insights, generate_recommendations, normalize_portfolio
from utils import DB_READY, database_unavailable_response, error_response

portfolio_routes = Blueprint("portfolio", __name__)

@portfolio_routes.route("/portfolio", methods=["POST"])
def portfolio():
    portfolio_data = request.get_json(silent=True)
    if portfolio_data is None:
        return error_response("Request body must be valid JSON.")
    
    result = analyze_portfolio(portfolio_data)
    if "error" in result:
        return error_response(result["error"], 422)
    return jsonify(result)

@portfolio_routes.route("/save-portfolio", methods=["POST"])
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
        saved = PortfolioRepository.save_portfolio(holdings, user)
    except ValueError as exc:
        return error_response(str(exc), 422)
    except Exception:
        return error_response("Unable to save portfolio.", 500)

    return jsonify({"message": "Portfolio saved successfully.", "portfolio": saved}), 201

@portfolio_routes.route("/portfolios", methods=["GET"])
def portfolios():
    if not DB_READY:
        return database_unavailable_response()
    try:
        return jsonify({"portfolios": PortfolioRepository.list_portfolios(request.args.get("user_id"))})
    except Exception:
        return error_response("Unable to load saved portfolios.", 500)

@portfolio_routes.route("/portfolio/<int:portfolio_id>", methods=["GET"])
def get_saved_portfolio(portfolio_id):
    if not DB_READY:
        return database_unavailable_response()
    try:
        saved = PortfolioRepository.get_portfolio(portfolio_id)
    except Exception:
        return error_response("Unable to load portfolio.", 500)
    
    if saved is None:
        return error_response("Portfolio not found.", 404)
    return jsonify(saved)

@portfolio_routes.route("/portfolio/<int:portfolio_id>", methods=["DELETE"])
def delete_saved_portfolio_endpoint(portfolio_id):
    if not DB_READY:
        return database_unavailable_response()
    try:
        deleted = PortfolioRepository.delete_portfolio(portfolio_id)
    except Exception:
        return error_response("Unable to delete portfolio.", 500)
    
    if not deleted:
        return error_response("Portfolio not found.", 404)
    return jsonify({"message": "Portfolio deleted successfully.", "portfolio_id": portfolio_id})

@portfolio_routes.route("/ai-insights", methods=["POST"])
def ai_insights():
    portfolio_data = request.get_json(silent=True)
    if portfolio_data is None:
        return error_response("Request body must be valid JSON.")
    
    result = analyze_portfolio(portfolio_data)
    insights = generate_ai_insights(result)
    return jsonify({"insights": insights})

@portfolio_routes.route("/recommendations", methods=["POST"])
def recommendations():
    portfolio_data = request.get_json(silent=True)
    if portfolio_data is None:
        return error_response("Request body must be valid JSON.")
    
    result = analyze_portfolio(portfolio_data)
    recommendations_result = generate_recommendations(result)
    return jsonify({"recommendations": recommendations_result})

@portfolio_routes.route("/compare-portfolios", methods=["POST"])
def compare_portfolios():
    data = request.get_json(silent=True) or {}
    portfolio_a = data.get("portfolioA")
    portfolio_b = data.get("portfolioB")

    if portfolio_a is None or portfolio_b is None:
        return error_response("portfolioA and portfolioB are required.")

    result_a = analyze_portfolio(portfolio_a)
    result_b = analyze_portfolio(portfolio_b)

    return jsonify({"portfolioA": result_a, "portfolioB": result_b})

from flask import Blueprint, jsonify, request
from repositories.chat_repository import ChatRepository
from chatbot import get_financial_advice
from portfolio import analyze_portfolio
from utils import DB_READY, database_unavailable_response, error_response

chat_routes = Blueprint("chat", __name__)

@chat_routes.route("/chat-history/<int:user_id>", methods=["GET"])
def chat_history_endpoint(user_id):
    if not DB_READY:
        return database_unavailable_response()
    try:
        return jsonify({"messages": ChatRepository.get_chat_history(user_id)})
    except Exception:
        return error_response("Unable to load chat history.", 500)

@chat_routes.route("/chat-history/<int:user_id>", methods=["DELETE"])
def clear_chat_history_endpoint(user_id):
    if not DB_READY:
        return database_unavailable_response()
    try:
        ChatRepository.clear_chat_history(user_id)
    except Exception:
        return error_response("Unable to clear chat history.", 500)
    return jsonify({"message": "Chat history cleared.", "user_id": user_id})

@chat_routes.route("/chatbot", methods=["POST"])
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
        ChatRepository.save_chat_message(user_id, user_name, "user", question)
        ChatRepository.save_chat_message(user_id, user_name, "assistant", response)
    except Exception:
        return error_response("Unable to save chat history.", 500)

    return jsonify({"response": response, "messages": ChatRepository.get_chat_history(user_id)})

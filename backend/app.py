from dotenv import load_dotenv
load_dotenv()

import os
from flask import Flask, jsonify
from flask_cors import CORS

from utils import DB_READY, DB_ERROR
from routes.market_routes import market_routes
from routes.user_routes import user_routes
from routes.chat_routes import chat_routes
from routes.portfolio_routes import portfolio_routes

app = Flask(__name__)
CORS(app)
PORT = os.getenv("PORT", 5000)

app.register_blueprint(market_routes)
app.register_blueprint(user_routes)
app.register_blueprint(chat_routes)
app.register_blueprint(portfolio_routes)

@app.route("/")
def home():
    return {
        "message": "Portfolio Risk Analyzer Backend Running",
        "database": "MongoDB",
        "database_connected": DB_READY,
    }

if __name__ == "__main__":
    app.run(
        debug=True,
        port=int(PORT),
    )

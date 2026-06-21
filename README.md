# Portfolio Risk Analyzer

A full-stack fintech web application that analyzes stock portfolios using real-time market data and provides risk analysis, diversification insights, and portfolio visualization.

---

## Features

- Live stock data using Yahoo Finance
- Portfolio risk analysis
- Diversification analysis
- Risk score calculation
- Interactive dashboard
- Portfolio allocation pie chart
- React + Flask integration

---

## Tech Stack

### Frontend
- React.js
- Axios
- Recharts

### Backend
- Flask
- Flask-CORS
- yfinance
- pandas
- numpy

---

## Project Structure

```text
portfolio-risk-analyzer/
│
├── backend/
│   ├── app.py
│   ├── portfolio.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│
├── .gitignore
│
└── README.md
```

---

## Setup Instructions

### Clone Repository

```bash
git clone https://github.com/Aarya0310/portfolio-risk-analyzer.git
```

---

## Backend Setup

```bash
cd backend

python -m venv venv

venv\Scripts\activate

pip install -r requirements.txt

python app.py
```

Backend runs at:

```text
http://127.0.0.1:5000
```

---

## Frontend Setup

```bash
cd frontend

npm install

npm start
```

Frontend runs at:

```text
http://localhost:3000
```

---

## Sample API Response

```json
{
  "total_portfolio_value": 25478.12,
  "risk_score": 85,
  "top_risk_stock": "TCS.NS",
  "diversification": "Poor"
}
```

---

## Future Enhancements

- AI Financial Chatbot
- Dynamic Stock Search
- Authentication System
- Portfolio History
- ML-based Predictions
- Dark Mode UI

---

## Author

Aarya Bhende - Intern
(PLANITT SOLUTIONS PVT LTD)

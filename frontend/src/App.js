import React, { useState } from "react";
import axios from "axios";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend
} from "recharts";

function App() {

  const [portfolioData, setPortfolioData] = useState(null);

  const [portfolioInput, setPortfolioInput] = useState({
    "AAPL": 5,
    "TSLA": 2,
    "TCS.NS": 10
  });

  const handleChange = (symbol, value) => {

    setPortfolioInput({
      ...portfolioInput,
      [symbol]: Number(value)
    });
  };

  const analyzePortfolio = () => {

    axios.post(
      "http://127.0.0.1:5000/portfolio",
      portfolioInput
    )

    .then(response => {
      setPortfolioData(response.data);
    })

    .catch(error => {
      console.error(error);
    });
  };

  const COLORS = [
    "#0088FE",
    "#00C49F",
    "#FFBB28",
    "#FF8042",
    "#AF19FF"
  ];

  return (

    <div style={{
      padding: "30px",
      fontFamily: "Arial",
      backgroundColor: "#f4f6f9",
      minHeight: "100vh"
    }}>

      <h1>Portfolio Risk Analyzer</h1>

      {/* Portfolio Input */}

      <div style={{
        backgroundColor: "white",
        padding: "20px",
        borderRadius: "10px",
        marginBottom: "30px",
        width: "400px",
        boxShadow: "0px 2px 8px rgba(0,0,0,0.1)"
      }}>

        <h2>Enter Portfolio</h2>

        <div style={{ marginBottom: "15px" }}>

          <label>AAPL Quantity:</label>

          <input
            type="number"
            value={portfolioInput["AAPL"]}
            onChange={(e) =>
              handleChange("AAPL", e.target.value)
            }
            style={inputStyle}
          />

        </div>

        <div style={{ marginBottom: "15px" }}>

          <label>TSLA Quantity:</label>

          <input
            type="number"
            value={portfolioInput["TSLA"]}
            onChange={(e) =>
              handleChange("TSLA", e.target.value)
            }
            style={inputStyle}
          />

        </div>

        <div style={{ marginBottom: "15px" }}>

          <label>TCS.NS Quantity:</label>

          <input
            type="number"
            value={portfolioInput["TCS.NS"]}
            onChange={(e) =>
              handleChange("TCS.NS", e.target.value)
            }
            style={inputStyle}
          />

        </div>

        <button
          onClick={analyzePortfolio}
          style={buttonStyle}
        >
          Analyze Portfolio
        </button>

      </div>

      {/* Show Results */}

      {portfolioData && (

        <>

          {/* Dashboard Cards */}

          <div style={{
            display: "flex",
            gap: "20px",
            marginBottom: "40px",
            flexWrap: "wrap"
          }}>

            <div style={cardStyle}>
              <h3>Total Portfolio Value</h3>
              <p style={cardText}>
                ₹ {portfolioData.total_portfolio_value}
              </p>
            </div>

            <div style={cardStyle}>
              <h3>Risk Score</h3>
              <p style={cardText}>
                {portfolioData.risk_score}
              </p>
            </div>

            <div style={cardStyle}>
              <h3>Diversification</h3>
              <p style={cardText}>
                {portfolioData.diversification}
              </p>
            </div>

            <div style={cardStyle}>
              <h3>Top Risk Stock</h3>
              <p style={cardText}>
                {portfolioData.top_risk_stock}
              </p>
            </div>

          </div>

          {/* Pie Chart */}

          <div style={{
            backgroundColor: "white",
            padding: "20px",
            borderRadius: "10px",
            marginBottom: "40px",
            width: "500px",
            boxShadow: "0px 2px 8px rgba(0,0,0,0.1)"
          }}>

            <h2>Portfolio Allocation</h2>

            <PieChart width={450} height={320}>

              <Pie
                data={portfolioData.stocks.map(stock => ({
                  name: stock.symbol,
                  value: stock.allocation_percentage
                }))}
                cx="50%"
                cy="50%"
                outerRadius={110}
                dataKey="value"
                label
              >

                {portfolioData.stocks.map((entry, index) => (

                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />

                ))}

              </Pie>

              <Tooltip />
              <Legend />

            </PieChart>

          </div>

        </>

      )}

    </div>
  );
}

/* Styles */

const inputStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "5px"
};

const buttonStyle = {
  backgroundColor: "#2563eb",
  color: "white",
  padding: "12px",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  width: "100%"
};

const cardStyle = {
  backgroundColor: "white",
  padding: "20px",
  borderRadius: "12px",
  width: "220px",
  boxShadow: "0px 2px 8px rgba(0,0,0,0.1)"
};

const cardText = {
  fontSize: "24px",
  fontWeight: "bold"
};

export default App;
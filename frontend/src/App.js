import React, { useEffect, useState } from "react";
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

  useEffect(() => {

    axios.get("http://127.0.0.1:5000/portfolio")
      .then(response => {
        setPortfolioData(response.data);
      })
      .catch(error => {
        console.error(error);
      });

  }, []);

  if (!portfolioData) {
    return <h2>Loading Portfolio Data...</h2>;
  }

  // Data for Pie Chart

  const chartData = portfolioData.stocks.map(stock => ({
    name: stock.symbol,
    value: stock.allocation_percentage
  }));

  // Chart Colors

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

      {/* Heading */}

      <h1 style={{
        marginBottom: "30px"
      }}>
        Portfolio Risk Analyzer
      </h1>

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
            data={chartData}
            cx="50%"
            cy="50%"
            outerRadius={110}
            fill="#8884d8"
            dataKey="value"
            label
          >

            {chartData.map((entry, index) => (

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

      {/* Holdings Table */}

      <h2 style={{
        marginBottom: "20px"
      }}>
        Portfolio Holdings
      </h2>

      <table style={{
        width: "100%",
        borderCollapse: "collapse",
        backgroundColor: "white",
        boxShadow: "0px 2px 8px rgba(0,0,0,0.1)"
      }}>

        <thead>

          <tr>

            <th style={tableHeader}>
              Symbol
            </th>

            <th style={tableHeader}>
              Quantity
            </th>

            <th style={tableHeader}>
              Latest Price
            </th>

            <th style={tableHeader}>
              Investment Value
            </th>

            <th style={tableHeader}>
              Allocation %
            </th>

          </tr>

        </thead>

        <tbody>

          {portfolioData.stocks.map((stock, index) => (

            <tr key={index}>

              <td style={tableCell}>
                {stock.symbol}
              </td>

              <td style={tableCell}>
                {stock.quantity}
              </td>

              <td style={tableCell}>
                ₹ {stock.latest_price}
              </td>

              <td style={tableCell}>
                ₹ {stock.investment_value}
              </td>

              <td style={tableCell}>
                {stock.allocation_percentage}%
              </td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  );
}

/* Card Styling */

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

/* Table Styling */

const tableHeader = {
  border: "1px solid #ddd",
  padding: "14px",
  backgroundColor: "#1f2937",
  color: "white",
  textAlign: "center"
};

const tableCell = {
  border: "1px solid #ddd",
  padding: "14px",
  textAlign: "center"
};

export default App;
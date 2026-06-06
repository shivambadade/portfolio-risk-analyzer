import Papa from "papaparse";
import { useEffect, useMemo, useState } from "react";

import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid
} from "recharts";


const API_BASE_URL = "http://127.0.0.1:5000";

const emptyHolding = {
  asset_type: "Stock",
  symbol: "",
  quantity: ""
};


function App() {
  const [comparisonData, setComparisonData] = useState(null);
  const [portfolioA] = useState({
    AAPL: 10
  });
  const [portfolioB] = useState({
    MSFT: 10
  });
  const [portfolio, setPortfolio] = useState([
    { ...emptyHolding }
  ]);
  const [portfolioData, setPortfolioData] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [savedPortfolios, setSavedPortfolios] = useState([]);
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [question, setQuestion] = useState("");
  const [chatResponse, setChatResponse] = useState("");
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#14b8a6"
  ];

  const chartAssets = useMemo(() => {
    if (!portfolioData) return [];

    return portfolioData.assets || portfolioData.stocks || [];
  }, [portfolioData]);

  const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

  const formatPortfolioPayload = () => portfolio
    .map(item => {
      const assetType = item.asset_type || "Stock";
      const quantity = Number(item.quantity);

      return {
        asset_type: assetType,
        symbol: item.symbol.trim(),
        quantity,
        units: quantity
      };
    })
    .filter(item => item.symbol && item.quantity > 0);

  const loadSavedPortfolios = () => {
    axios.get(`${API_BASE_URL}/portfolios`)
      .then(response => {
        setSavedPortfolios(response.data.portfolios || []);
      })
      .catch(() => {
        setStatusMessage("Saved portfolios could not be loaded.");
      });
  };

  useEffect(() => {
    loadSavedPortfolios();
  }, []);

  const handleChange = (index, field, value) => {
    const updatedPortfolio = [...portfolio];
    updatedPortfolio[index][field] = value;

    setPortfolio(updatedPortfolio);
  };

  const addAssetField = () => {
    setPortfolio([
      ...portfolio,
      { ...emptyHolding }
    ]);
  };

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];

    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: function(results) {
        const parsedPortfolio = results.data.map(item => ({
          asset_type: item.asset_type || item.assetType || "Stock",
          symbol: item.symbol || item.fund || item.fund_name || "",
          quantity: item.quantity || item.units || ""
        }));

        setPortfolio(parsedPortfolio);
      }
    });
  };

  const fetchHistory = (analysis) => {
    const firstAsset = (analysis.assets || analysis.stocks || [])[0];

    if (!firstAsset) {
      setHistoryData([]);
      return;
    }

    const url = firstAsset.asset_type === "Mutual Fund"
      ? `${API_BASE_URL}/mutual-fund-history/${encodeURIComponent(firstAsset.symbol)}`
      : `${API_BASE_URL}/history/${firstAsset.symbol}`;

    axios.get(url)
      .then(historyResponse => {
        setHistoryData(historyResponse.data);
      })
      .catch(() => {
        setHistoryData([]);
      });
  };

  const analyzePortfolio = () => {
    setLoading(true);
    setStatusMessage("");

    const formattedPortfolio = formatPortfolioPayload();

    axios.post(
      `${API_BASE_URL}/portfolio`,
      formattedPortfolio
    )
      .then(response => {
        setPortfolioData(response.data);
        fetchHistory(response.data);

        return Promise.all([
          axios.post(`${API_BASE_URL}/ai-insights`, formattedPortfolio),
          axios.post(`${API_BASE_URL}/recommendations`, formattedPortfolio)
        ]);
      })
      .then(([aiResponse, recommendationResponse]) => {
        setInsights(aiResponse.data.insights || []);
        setRecommendations(recommendationResponse.data.recommendations || []);
      })
      .catch(error => {
        setStatusMessage(error.response?.data?.error || "Portfolio analysis failed.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const saveCurrentPortfolio = () => {
    const holdings = formatPortfolioPayload();

    axios.post(
      `${API_BASE_URL}/save-portfolio`,
      { holdings }
    )
      .then(() => {
        setStatusMessage("Portfolio saved.");
        loadSavedPortfolios();
      })
      .catch(error => {
        setStatusMessage(error.response?.data?.error || "Portfolio could not be saved.");
      });
  };

  const loadPortfolio = (portfolioId) => {
    axios.get(`${API_BASE_URL}/portfolio/${portfolioId}`)
      .then(response => {
        const holdings = response.data.holdings.map(item => ({
          asset_type: item.asset_type,
          symbol: item.symbol,
          quantity: item.quantity
        }));

        setPortfolio(holdings.length ? holdings : [{ ...emptyHolding }]);
        setStatusMessage(`Portfolio ${portfolioId} loaded.`);
      })
      .catch(error => {
        setStatusMessage(error.response?.data?.error || "Portfolio could not be loaded.");
      });
  };

  const deletePortfolio = (portfolioId) => {
    axios.delete(`${API_BASE_URL}/portfolio/${portfolioId}`)
      .then(() => {
        setStatusMessage(`Portfolio ${portfolioId} deleted.`);
        loadSavedPortfolios();
      })
      .catch(error => {
        setStatusMessage(error.response?.data?.error || "Portfolio could not be deleted.");
      });
  };

  const askChatbot = () => {

  const formattedPortfolio = {};

  portfolio.forEach(stock => {

    if (
      stock.symbol &&
      stock.quantity
    ) {

      formattedPortfolio[
        stock.symbol.toUpperCase()
      ] = Number(stock.quantity);
    }
  });

  const userMessage = {
    role: "user",
    content: question
  };

  setMessages(prev => [
    ...prev,
    userMessage
  ]);

  axios.post(
    "http://127.0.0.1:5000/chatbot",
    {
      question,
      portfolio: formattedPortfolio
    }
  )

  .then(response => {

    const aiMessage = {
      role: "assistant",
      content: response.data.response
    };

    setMessages(prev => [
      ...prev,
      aiMessage
    ]);

    setQuestion("");
  })

  .catch(error => {

    console.log(error);
  });
};

  const comparePortfolios = () => {
    axios.post(
      `${API_BASE_URL}/compare-portfolios`,
      {
        portfolioA,
        portfolioB
      }
    )
      .then(response => {
        setComparisonData(response.data);
      })
      .catch(() => {
        setStatusMessage("Portfolio comparison failed.");
      });
  };

  const downloadReport = () => {
    if (!portfolioData) return;

    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Portfolio Risk Analysis Report", 14, 20);

    doc.setFontSize(12);
    doc.text(`Portfolio Value: ${formatCurrency(portfolioData.total_portfolio_value)}`, 14, 35);
    doc.text(`Risk Score: ${portfolioData.risk_score}`, 14, 45);
    doc.text(`Diversification: ${portfolioData.diversification}`, 14, 55);
    doc.text(`Health Score: ${portfolioData.health_score}/100`, 14, 65);

    autoTable(doc, {
      startY: 80,
      head: [[
        "Type",
        "Name",
        "Qty / Units",
        "Price / NAV",
        "Risk",
        "Allocation %"
      ]],
      body: chartAssets.map(asset => [
        asset.asset_type,
        asset.asset_type === "Mutual Fund" ? asset.fund_name : asset.symbol,
        asset.asset_type === "Mutual Fund" ? asset.units : asset.quantity,
        asset.asset_type === "Mutual Fund" ? asset.nav : asset.latest_price,
        asset.risk_classification || `${asset.volatility}%`,
        asset.allocation_percentage
      ])
    });

    let currentY = doc.lastAutoTable.finalY + 15;

    doc.text("AI Insights", 14, currentY);
    currentY += 10;

    insights.forEach(insight => {
      doc.text(`- ${insight}`, 14, currentY);
      currentY += 8;
    });

    currentY += 10;
    doc.text("Recommendations", 14, currentY);
    currentY += 10;

    recommendations.forEach(item => {
      doc.text(`- ${item}`, 14, currentY);
      currentY += 8;
    });

    doc.save("Portfolio_Report.pdf");
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-8">
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-blue-400">
          Portfolio Risk Analyzer
        </h1>
        <p className="text-gray-400 mt-3 text-lg">
          AI-powered fintech dashboard for portfolio analytics
        </p>
      </div>

      <div className="bg-gray-900 p-6 rounded-2xl shadow-lg mb-8 max-w-5xl">
        <h2 className="text-2xl font-semibold mb-6">
          Enter Portfolio
        </h2>

        <div className="mb-6">
          <input
            type="file"
            accept=".csv"
            onChange={handleCSVUpload}
            className="block w-full text-sm text-gray-400"
          />
        </div>

        {portfolio.map((asset, index) => (
          <div
            key={index}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4"
          >
            <select
              value={asset.asset_type}
              onChange={(e) => handleChange(index, "asset_type", e.target.value)}
              className="p-3 rounded-lg bg-gray-800 border border-gray-700"
            >
              <option>Stock</option>
              <option>Mutual Fund</option>
            </select>

            <input
              type="text"
              placeholder={asset.asset_type === "Mutual Fund" ? "Fund ticker or name" : "Stock Symbol"}
              value={asset.symbol}
              onChange={(e) => handleChange(index, "symbol", e.target.value)}
              className="p-3 rounded-lg bg-gray-800 border border-gray-700"
            />

            <input
              type="number"
              placeholder={asset.asset_type === "Mutual Fund" ? "Units" : "Quantity"}
              value={asset.quantity}
              onChange={(e) => handleChange(index, "quantity", e.target.value)}
              className="p-3 rounded-lg bg-gray-800 border border-gray-700"
            />
          </div>
        ))}

        <div className="flex flex-wrap gap-4 mt-6">
          <button
            onClick={addAssetField}
            className="bg-gray-700 hover:bg-gray-600 px-5 py-3 rounded-lg"
          >
            Add Asset
          </button>

          <button
            onClick={analyzePortfolio}
            className="bg-blue-500 hover:bg-blue-600 px-5 py-3 rounded-lg font-semibold"
          >
            Analyze Portfolio
          </button>

          <button
            onClick={saveCurrentPortfolio}
            className="bg-green-600 hover:bg-green-700 px-5 py-3 rounded-lg font-semibold"
          >
            Save Portfolio
          </button>

          <button
            onClick={loadSavedPortfolios}
            className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-lg font-semibold"
          >
            Load Portfolios
          </button>
        </div>

        {statusMessage && (
          <div className="mt-5 bg-gray-800 border border-gray-700 p-4 rounded-lg text-sm">
            {statusMessage}
          </div>
        )}
      </div>

      <div className="bg-gray-900 p-6 rounded-2xl shadow-lg mb-8 max-w-5xl">
        <h2 className="text-2xl font-semibold mb-6">
          Saved Portfolios
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="p-3">Portfolio ID</th>
                <th className="p-3">Created</th>
                <th className="p-3">Holdings</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {savedPortfolios.map(saved => (
                <tr
                  key={saved.portfolio_id}
                  className="border-b border-gray-800 hover:bg-gray-800"
                >
                  <td className="p-3">{saved.portfolio_id}</td>
                  <td className="p-3">{saved.created_at}</td>
                  <td className="p-3">{saved.holdings_count}</td>
                  <td className="p-3">
                    <div className="flex gap-3">
                      <button
                        onClick={() => loadPortfolio(saved.portfolio_id)}
                        className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-sm"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => deletePortfolio(saved.portfolio_id)}
                        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {savedPortfolios.length === 0 && (
                <tr>
                  <td className="p-3 text-gray-400" colSpan="4">
                    No saved portfolios yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {loading && (
        <div className="text-xl text-yellow-400 mb-8">
          Loading Portfolio Analysis...
        </div>
      )}

      {portfolioData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
              <h3 className="text-gray-400 mb-2">
                Total Portfolio Value
              </h3>
              <p className="text-3xl font-bold text-green-400">
                {formatCurrency(portfolioData.total_portfolio_value)}
              </p>
            </div>

            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
              <h3 className="text-gray-400 mb-2">
                Risk Score
              </h3>
              <p className="text-3xl font-bold text-red-400">
                {portfolioData.risk_score}
              </p>
            </div>

            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
              <h3 className="text-gray-400 mb-2">
                Diversification
              </h3>
              <p className="text-3xl font-bold text-blue-400">
                {portfolioData.diversification}
              </p>
            </div>

            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
              <h3 className="text-gray-400 mb-2">
                Health Score
              </h3>
              <p className="text-3xl font-bold text-green-400">
                {portfolioData.health_score}/100
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-6">
                Portfolio Allocation
              </h2>
              <PieChart width={400} height={300}>
                <Pie
                  data={chartAssets}
                  dataKey="allocation_percentage"
                  nameKey="symbol"
                  outerRadius={100}
                  label
                >
                  {chartAssets.map((entry, index) => (
                    <Cell
                      key={index}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </div>

            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
              <h2 className="text-2xl font-semibold mb-6">
                Asset Trend
              </h2>
              <LineChart
                width={500}
                height={300}
                data={historyData}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey={historyData[0]?.nav !== undefined ? "nav" : "close"}
                  stroke="#3b82f6"
                  strokeWidth={3}
                />
              </LineChart>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">
              Portfolio Breakdown
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-3">Type</th>
                    <th className="p-3">Name</th>
                    <th className="p-3">Qty / Units</th>
                    <th className="p-3">Price / NAV</th>
                    <th className="p-3">Value</th>
                    <th className="p-3">Risk</th>
                    <th className="p-3">Allocation %</th>
                  </tr>
                </thead>
                <tbody>
                  {chartAssets.map((asset, index) => (
                    <tr
                      key={`${asset.symbol}-${index}`}
                      className="border-b border-gray-800 hover:bg-gray-800"
                    >
                      <td className="p-3">{asset.asset_type}</td>
                      <td className="p-3">
                        {asset.asset_type === "Mutual Fund" ? asset.fund_name : asset.symbol}
                      </td>
                      <td className="p-3">
                        {asset.asset_type === "Mutual Fund" ? asset.units : asset.quantity}
                      </td>
                      <td className="p-3">
                        {formatCurrency(asset.asset_type === "Mutual Fund" ? asset.nav : asset.latest_price)}
                      </td>
                      <td className="p-3">{formatCurrency(asset.current_value)}</td>
                      <td className="p-3">
                        {asset.risk_classification || `${asset.volatility}%`}
                      </td>
                      <td className="p-3">
                        {asset.allocation_percentage}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg mt-10">
            <button
              onClick={downloadReport}
              className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-lg font-semibold"
            >
              Download PDF Report
            </button>
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg mt-10">
            <h2 className="text-2xl font-semibold mb-6 text-yellow-400">
              Portfolio Recommendations
            </h2>

            {recommendations.map((item, index) => (
              <div
                key={index}
                className="bg-gray-800 p-4 rounded-lg border border-gray-700 mb-3"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg mt-10">
            <h2 className="text-2xl font-semibold mb-6 text-purple-400">
              Portfolio Comparison
            </h2>
            <button
              onClick={comparePortfolios}
              className="bg-purple-600 hover:bg-purple-700 px-5 py-3 rounded-lg font-semibold"
            >
              Compare Sample Portfolios
            </button>
          </div>

          {comparisonData && (
            <div className="bg-gray-900 p-6 rounded-2xl shadow-lg mt-6">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="p-3">Metric</th>
                    <th className="p-3">Portfolio A</th>
                    <th className="p-3">Portfolio B</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3">Risk Score</td>
                    <td className="p-3">
                      {comparisonData.portfolioA.risk_score}
                    </td>
                    <td className="p-3">
                      {comparisonData.portfolioB.risk_score}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">Health Score</td>
                    <td className="p-3">
                      {comparisonData.portfolioA.health_score}
                    </td>
                    <td className="p-3">
                      {comparisonData.portfolioB.health_score}
                    </td>
                  </tr>
                  <tr>
                    <td className="p-3">Diversification</td>
                    <td className="p-3">
                      {comparisonData.portfolioA.diversification}
                    </td>
                    <td className="p-3">
                      {comparisonData.portfolioB.diversification}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg mt-10">

  <h2 className="text-2xl font-semibold mb-6 text-green-400">
    AI Financial Assistant
  </h2>

  {/* Chat Messages */}

  <div className="space-y-3 mb-4">

  {messages.map((msg, index) => (

    <div
      key={index}
      className={
        msg.role === "user"
          ? "bg-blue-600 p-3 rounded-lg"
          : "bg-gray-800 p-3 rounded-lg"
      }
    >

      <strong>
        {msg.role === "user"
          ? "You"
          : "AI"}
      </strong>

      <p>{msg.content}</p>

    </div>

  ))}

</div>

  <textarea
    placeholder="Ask about your portfolio..."
    value={question}
    onChange={(e) =>
      setQuestion(e.target.value)
    }
    className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 mb-4"
  />
            <button
              onClick={askChatbot}
              className="bg-green-500 hover:bg-green-600 px-5 py-3 rounded-lg font-semibold"
            >
              Ask AI
            </button>

            {chatResponse && (
              <div className="mt-6 bg-gray-800 p-4 rounded-lg border border-gray-700">
                {chatResponse}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;

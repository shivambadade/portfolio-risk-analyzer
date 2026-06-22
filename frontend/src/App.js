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
  Legend
} from "recharts";


const API_BASE_URL = "http://127.0.0.1:5000";

const emptyHolding = {
  asset_type: "Stock",
  symbol: "",
  quantity: "",
  investment_amount: ""
};


function App() {
  const [portfolio, setPortfolio] = useState([
    { ...emptyHolding }
  ]);
  const [portfolioData, setPortfolioData] = useState(null);
  
  const [savedPortfolios, setSavedPortfolios] = useState([]);
  const [insights, setInsights] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
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

    const data = portfolioData.assets || portfolioData.stocks || [];
    return Array.isArray(data) ? data : [];
  }, [portfolioData]);

  const formatCurrency = (value) => `Rs. ${Number(value || 0).toLocaleString("en-IN")}`;

  const formatPortfolioPayload = () => (Array.isArray(portfolio) ? portfolio : [])
    .map(item => {
      const assetType = item.asset_type || "Stock";
      const quantity = Number(item.quantity);
      const investmentAmount = Number(item.investment_amount);
      const holding = {
        asset_type: assetType,
        symbol: item.symbol.trim(),
      };

      if (quantity > 0) {
        holding.quantity = quantity;
        holding.units = quantity;
      }

      if (investmentAmount > 0) {
        holding.investment_amount = investmentAmount;
      }

      return holding;
    })
    .filter(item => item.symbol && (item.quantity > 0 || item.investment_amount > 0));

  const loadSavedPortfolios = () => {
    axios.get(`${API_BASE_URL}/portfolios`)
      .then(response => {
        setSavedPortfolios(Array.isArray(response.data.portfolios) ? response.data.portfolios : []);
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
        const rows = Array.isArray(results.data) ? results.data : [];
        const parsedPortfolio = rows.map(item => ({
          asset_type: item.asset_type || item.assetType || "Stock",
          symbol: item.symbol || item.fund || item.fund_name || "",
          quantity: item.quantity || item.units || "",
          investment_amount: item.investment_amount || item.investmentAmount || item.amount || ""
        }));

        setPortfolio(Array.isArray(parsedPortfolio) ? parsedPortfolio : [{ ...emptyHolding }]);
      }
    });
  };

  

  const analyzePortfolio = () => {
    setLoading(true);
    setStatusMessage("");

    const formattedPortfolio = formatPortfolioPayload();

    axios.post(
      `${API_BASE_URL}/portfolio`,
      { holdings: formattedPortfolio }
    )
      .then(response => {
        const data = response.data || {};
        setPortfolioData(data);

        return Promise.all([
          axios.post(`${API_BASE_URL}/ai-insights`, { holdings: formattedPortfolio }),
          axios.post(`${API_BASE_URL}/recommendations`, { holdings: formattedPortfolio })
        ]);
      })
      .then(([aiResponse, recommendationResponse]) => {
        setInsights(Array.isArray(aiResponse.data?.insights) ? aiResponse.data.insights : []);
        setRecommendations(Array.isArray(recommendationResponse.data?.recommendations) ? recommendationResponse.data.recommendations : []);
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
        const holdingsData = Array.isArray(response.data.holdings) ? response.data.holdings : [];
        const holdings = holdingsData.map(item => ({
          asset_type: item.asset_type,
          symbol: item.symbol,
          quantity: item.quantity,
          investment_amount: item.investment_amount || ""
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
    if (!question.trim()) {
      setStatusMessage("Please enter a question for the AI.");
      return;
    }

    const formattedPortfolio = formatPortfolioPayload();
    const userMessage = {
      role: "user",
      content: question.trim()
    };

    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setChatLoading(true);
    setStatusMessage("");

    axios.post(
      `${API_BASE_URL}/chatbot`,
      {
        question: userMessage.content,
        portfolio: formattedPortfolio,
        messages: nextMessages
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
        setStatusMessage(error.response?.data?.error || "Chatbot request failed.");
      })
      .finally(() => {
        setChatLoading(false);
      });
  };

  const handleChatKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      askChatbot();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setStatusMessage("");
  };

  const downloadReport = () => {
    if (!portfolioData) return;
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 48;
    doc.setLineHeightFactor(1.35);

    // Title (centered)
    const title = 'Portfolio Risk Analysis Report';
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text(title, pageWidth / 2, 70, { align: 'center' });

    // Generated timestamp (right)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const now = new Date();
    doc.text(`Generated: ${now.toLocaleString()}`, pageWidth - margin, 88, { align: 'right' });

    // Horizontal rule
    doc.setDrawColor(200);
    doc.setLineWidth(0.5);
    doc.line(margin, 96, pageWidth - margin, 96);

    // Summary box with light background
    const summaryY = 110;
    const boxHeight = 64;
    doc.setFillColor(245, 250, 250);
    doc.roundedRect(margin, summaryY, pageWidth - margin * 2, boxHeight, 6, 6, 'F');

    doc.setFontSize(11);
    const leftColX = margin + 12;
    const rightColX = pageWidth / 2 + 12;
    doc.text(`Total Portfolio Value: ${formatCurrency(portfolioData.total_portfolio_value)}`, leftColX, summaryY + 20);
    doc.text(`Diversification: ${portfolioData.diversification}`, leftColX, summaryY + 36);
    doc.text(`Risk Score: ${portfolioData.risk_score}`, rightColX, summaryY + 20);
    doc.text(`Health Score: ${portfolioData.health_score}/100`, rightColX, summaryY + 36);
    if (portfolioData.top_risk_asset) {
      doc.setFontSize(10);
      doc.text(`Top Exposure: ${portfolioData.top_risk_asset}`, leftColX, summaryY + 52);
    }

    // Spacing before table
    const tableStart = summaryY + boxHeight + 24;

    // Asset table with nicer styling
    autoTable(doc, {
      startY: tableStart,
      margin: { left: margin, right: margin },
      styles: { font: 'helvetica', fontSize: 10, cellPadding: 8, overflow: 'linebreak' },
      headStyles: { fillColor: [22, 160, 133], textColor: 255, halign: 'center' },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      theme: 'grid',
      head: [[
        'Type', 'Name', 'Qty / Units', 'Invested Amount', 'Price / NAV', 'Current Value', 'Allocation %', 'Volatility'
      ]],
      body: (Array.isArray(chartAssets) ? chartAssets : []).map(asset => [
        asset.asset_type,
        asset.asset_type === 'Mutual Fund' ? asset.fund_name || asset.symbol : asset.symbol,
        asset.asset_type === 'Mutual Fund' ? (asset.units != null ? asset.units : '-') : (asset.quantity != null ? asset.quantity : '-'),
        asset.investment_amount ? formatCurrency(asset.investment_amount) : '-',
        asset.asset_type === 'Mutual Fund' ? (asset.nav != null ? asset.nav : '-') : (asset.latest_price != null ? asset.latest_price : '-'),
        asset.current_value ? formatCurrency(asset.current_value) : '-',
        asset.allocation_percentage != null ? `${asset.allocation_percentage}%` : '-',
        asset.volatility != null ? `${asset.volatility}%` : '-'
      ])
    });

    let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : tableStart + 180;

    // Positive impact suggestions (tailored) with spacing and wrapping
    const positiveSuggestions = [];
    if (portfolioData.diversification === 'Poor') {
      positiveSuggestions.push('Improve diversification by adding broad ETFs or mutual funds across different sectors.');
    }
    if (portfolioData.risk_score > 40) {
      positiveSuggestions.push('Reduce exposure to highly volatile holdings and consider reallocating to lower-risk assets.');
    }
    if (portfolioData.health_score < 60) {
      positiveSuggestions.push('Increase allocation to stable assets (e.g., index funds, bonds) to improve portfolio health.');
    }
    positiveSuggestions.push('Consider dollar-cost averaging for new investments to lower timing risk.');
    positiveSuggestions.push('Prefer low-cost index ETFs for long-term, tax-efficient growth.');

    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text('Positive Impact Suggestions', margin, currentY);
    currentY += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    const maxTextWidth = pageWidth - margin * 2 - 20;
    positiveSuggestions.forEach(s => {
      const lines = doc.splitTextToSize(`- ${s}`, maxTextWidth);
      doc.text(lines, margin + 12, currentY);
      currentY += lines.length * 14;
      if (currentY > 760) { doc.addPage(); currentY = margin; }
    });

    currentY += 8;

    // Recommendations (from backend)
    if (Array.isArray(recommendations) && recommendations.length) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('Recommendations', margin, currentY);
      currentY += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      recommendations.forEach(r => {
        const lines = doc.splitTextToSize(`- ${r}`, maxTextWidth);
        doc.text(lines, margin + 12, currentY);
        currentY += lines.length * 14;
        if (currentY > 760) { doc.addPage(); currentY = margin; }
      });
    }

    currentY += 8;

    // AI Insights
    if (Array.isArray(insights) && insights.length) {
      doc.setFontSize(13);
      doc.setFont('helvetica', 'bold');
      doc.text('AI Insights', margin, currentY);
      currentY += 18;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      insights.forEach(i => {
        const lines = doc.splitTextToSize(`- ${i}`, maxTextWidth);
        doc.text(lines, margin + 12, currentY);
        currentY += lines.length * 14;
        if (currentY > 760) { doc.addPage(); currentY = margin; }
      });
    }

    // Footer centered
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Generated by Portfolio Risk Analyzer', pageWidth / 2, 820, { align: 'center' });

    doc.save('Portfolio_Report.pdf');
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
            className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4"
          >
            <select
              value={asset.asset_type}
              onChange={(e) => handleChange(index, "asset_type", e.target.value)}
              className="p-3 rounded-lg bg-gray-800 border border-gray-700"
            >
              <option>Stock</option>
              <option>Mutual Fund</option>
              <option>Forex</option>
              <option>Crypto</option>
            </select>

            <input
              type="text"
              placeholder={
                asset.asset_type === "Mutual Fund"
                  ? "Fund ticker or name"
                  : asset.asset_type === "Forex"
                    ? "Forex symbol"
                    : asset.asset_type === "Crypto"
                      ? "Crypto symbol"
                      : "Stock symbol"
              }
              value={asset.symbol}
              onChange={(e) => handleChange(index, "symbol", e.target.value)}
              className="p-3 rounded-lg bg-gray-800 border border-gray-700"
            />

            <input
              type="number"
              placeholder="Quantity"
              value={asset.quantity}
              onChange={(e) => handleChange(index, "quantity", e.target.value)}
              className="p-3 rounded-lg bg-gray-800 border border-gray-700"
            />

            <input
              type="number"
              placeholder="Invested Amount"
              step="0.01"
              value={asset.investment_amount}
              onChange={(e) => handleChange(index, "investment_amount", e.target.value)}
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

            
          </div>

          <div className="bg-gray-900 p-6 rounded-2xl shadow-lg">
            <h2 className="text-2xl font-semibold mb-6">
              Portfolio Breakdown
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="p-3">Asset Type</th>
                    <th className="p-3">Symbol</th>
                    <th className="p-3">Quantity</th>
                    <th className="p-3">Current Value</th>
                    <th className="p-3">Allocation %</th>
                    <th className="p-3">Volatility</th>
                  </tr>
                </thead>
                <tbody>
                  {chartAssets.map((asset, index) => (
                    <tr
                      key={`${asset.symbol}-${index}`}
                      className="border-b border-gray-800 hover:bg-gray-800"
                    >
                      <td className="p-3">{asset.asset_type}</td>
                      <td className="p-3">{asset.symbol}</td>
                      <td className="p-3">{asset.quantity}</td>
                      <td className="p-3">{asset.investment_amount ? formatCurrency(asset.investment_amount) : "-"}</td>
                      <td className="p-3">{formatCurrency(asset.current_value)}</td>
                      <td className="p-3">{asset.allocation_percentage}%</td>
                      <td className="p-3">{asset.volatility}%</td>
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
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-green-400">
                AI Financial Assistant
              </h2>
              <button
                onClick={clearChat}
                disabled={chatLoading}
                className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm"
              >
                Clear Chat
              </button>
            </div>

            <div className="space-y-3 mb-4 max-h-80 overflow-y-auto pr-2">
              {messages.length === 0 && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 text-gray-400">
                  Start a conversation with the AI assistant about your portfolio.
                </div>
              )}

              {messages.map((msg, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${msg.role === "user" ? "bg-blue-600 self-end text-white" : "bg-gray-800 text-gray-200"}`}
                >
                  <div className="text-xs uppercase tracking-wide text-gray-300 mb-1">
                    {msg.role === "user" ? "You" : "AI"}
                  </div>
                  <p>{msg.content}</p>
                </div>
              ))}
            </div>

            <textarea
              placeholder="Ask about your portfolio..."
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleChatKeyDown}
              rows={4}
              className="w-full p-4 rounded-lg bg-gray-800 border border-gray-700 mb-4"
            />

            <div className="flex flex-wrap gap-4 items-center">
              <button
                onClick={askChatbot}
                disabled={chatLoading}
                className={`px-5 py-3 rounded-lg font-semibold ${chatLoading ? "bg-gray-600 cursor-not-allowed" : "bg-green-500 hover:bg-green-600"}`}
              >
                {chatLoading ? "Thinking..." : "Ask AI"}
              </button>
              <span className="text-sm text-gray-400">Press Enter to send.</span>
            </div>

            {chatLoading && (
              <div className="mt-4 text-sm text-yellow-300">
                AI is reviewing your portfolio and question...
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default App;

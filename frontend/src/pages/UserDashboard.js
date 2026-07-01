import Papa from "papaparse";
import { useCallback, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { api } from "../services/api";
import { TrendingUp, ShieldCheck } from "lucide-react";

import UserPanel from "../components/UserPanel";
import PortfolioForm from "../components/PortfolioForm";
import SavedPortfolios from "../components/SavedPortfolios";
import Dashboard from "../components/Dashboard";
import Chatbot from "../components/Chatbot";

const emptyHolding = {
  asset_type: "Stock",
  symbol: "",
  quantity: "",
  investment_amount: ""
};

function UserDashboard() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userForm, setUserForm] = useState({ name: "", email: "" });
  const [users, setUsers] = useState([]);
  const [portfolio, setPortfolio] = useState([{ ...emptyHolding }]);
  const [portfolioData, setPortfolioData] = useState(null);
  const [savedPortfolios, setSavedPortfolios] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#14b8a6"];

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
      const holding = { asset_type: assetType, symbol: item.symbol.trim() };

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

  const loadUsers = useCallback(() => {
    api.getUsers()
      .then(response => {
        setUsers(Array.isArray(response.data.users) ? response.data.users : []);
      })
      .catch(() => setStatusMessage("Saved users could not be loaded."));
  }, []);

  const loadChatHistory = (userId) => {
    if (!userId) {
      setMessages([]);
      return;
    }
    api.getChatHistory(userId)
      .then(response => {
        setMessages(Array.isArray(response.data.messages) ? response.data.messages : []);
      })
      .catch(() => setMessages([]));
  };

  const loadSavedPortfolios = useCallback((userId = currentUser?.user_id) => {
    api.getSavedPortfolios(userId)
      .then(response => {
        setSavedPortfolios(Array.isArray(response.data.portfolios) ? response.data.portfolios : []);
      })
      .catch(() => setStatusMessage("Saved portfolios could not be loaded."));
  }, [currentUser]);

  useEffect(() => {
    loadUsers();
    loadSavedPortfolios();
  }, [loadSavedPortfolios, loadUsers]);

  const saveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      setStatusMessage("Please enter both name and email.");
      return;
    }

    api.saveUser(userForm)
      .then(response => {
        const savedUser = response.data.user;
        setCurrentUser(savedUser);
        setUserForm({ name: savedUser.name, email: savedUser.email });
        setStatusMessage(`Active user: ${savedUser.name}`);
        loadUsers();
        loadSavedPortfolios(savedUser.user_id);
        loadChatHistory(savedUser.user_id);
      })
      .catch(error => {
        setStatusMessage(error.response?.data?.error || "User could not be saved.");
      });
  };

  const selectUser = (userId) => {
    const selectedUser = users.find(user => String(user.user_id) === String(userId));
    if (!selectedUser) return;
    setCurrentUser(selectedUser);
    setUserForm({ name: selectedUser.name, email: selectedUser.email });
    setStatusMessage(`Active user: ${selectedUser.name}`);
    loadSavedPortfolios(selectedUser.user_id);
    loadChatHistory(selectedUser.user_id);
  };

  const handleChange = (index, field, value) => {
    const updatedPortfolio = [...portfolio];
    updatedPortfolio[index][field] = value;
    setPortfolio(updatedPortfolio);
  };

  const addAssetField = () => {
    setPortfolio([...portfolio, { ...emptyHolding }]);
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
          investment_amount: item.investment_amount || item.investmentAmount || ""
        })).filter(item => item.symbol);

        if (parsedPortfolio.length > 0) {
          setPortfolio(parsedPortfolio);
          setStatusMessage(`Loaded ${parsedPortfolio.length} assets from CSV.`);
        } else {
          setStatusMessage("No valid assets found in CSV.");
        }
      },
      error: function() {
        setStatusMessage("Failed to parse CSV file.");
      }
    });
  };

  const analyzePortfolio = () => {
    const formattedPortfolio = formatPortfolioPayload();

    if (formattedPortfolio.length === 0) {
      setStatusMessage("Please enter at least one valid asset (symbol + quantity or investment).");
      return;
    }

    setLoading(true);
    setStatusMessage("");

    api.analyzePortfolio(formattedPortfolio)
      .then(response => {
        setPortfolioData(response.data);
        return Promise.allSettled([
          api.getAiInsights(formattedPortfolio),
          api.getRecommendations(formattedPortfolio)
        ]);
      })
      .then(results => {
        const insightsResult = results[0];
        const recommendationsResult = results[1];

        if (recommendationsResult.status === "fulfilled") {
          setRecommendations(recommendationsResult.value.data.recommendations || []);
        } else {
          setRecommendations(["Recommendations are currently unavailable."]);
        }
      })
      .catch(error => {
        setStatusMessage(error.response?.data?.error || "Error analyzing portfolio");
        setPortfolioData(null);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  const saveCurrentPortfolio = () => {
    const formattedPortfolio = formatPortfolioPayload();

    if (formattedPortfolio.length === 0) {
      setStatusMessage("Please enter at least one valid asset to save.");
      return;
    }

    if (!currentUser) {
      setStatusMessage("Please select or save a user first.");
      return;
    }

    api.savePortfolio(formattedPortfolio, currentUser)
      .then(response => {
        setStatusMessage(response.data.message);
        loadSavedPortfolios(currentUser.user_id);
      })
      .catch(error => {
        setStatusMessage(error.response?.data?.error || "Failed to save portfolio.");
      });
  };

  const loadPortfolio = (portfolioId) => {
    api.getPortfolioById(portfolioId)
      .then(response => {
        const loadedHoldings = response.data.holdings;
        const normalizedHoldings = loadedHoldings.map(h => ({
          asset_type: h.asset_type,
          symbol: h.symbol || h.fund_name,
          quantity: h.quantity || h.units || "",
          investment_amount: h.investment_amount || ""
        }));

        setPortfolio(normalizedHoldings.length ? normalizedHoldings : [{ ...emptyHolding }]);
        setStatusMessage(`Loaded portfolio ${portfolioId}`);
        analyzePortfolio();
      })
      .catch(error => {
        setStatusMessage(error.response?.data?.error || "Failed to load portfolio.");
      });
  };

  const deletePortfolio = (portfolioId) => {
    if (!window.confirm("Are you sure you want to delete this portfolio?")) return;

    api.deletePortfolio(portfolioId)
      .then(() => {
        setStatusMessage(`Deleted portfolio ${portfolioId}`);
        loadSavedPortfolios(currentUser?.user_id);
      })
      .catch(error => {
        setStatusMessage(error.response?.data?.error || "Failed to delete portfolio.");
      });
  };

  const askChatbot = () => {
    if (!question.trim()) return;

    if (!currentUser) {
      setStatusMessage("Please select or save a user first to use the chat.");
      return;
    }

    setChatLoading(true);

    const formattedPortfolio = formatPortfolioPayload();

    api.askChatbot(question, formattedPortfolio, messages, currentUser)
      .then(response => {
        setMessages(response.data.messages);
        setQuestion("");
      })
      .catch(error => {
        setStatusMessage(error.response?.data?.error || "Chat failed.");
      })
      .finally(() => {
        setChatLoading(false);
      });
  };

  const clearChat = () => {
    if (!currentUser) {
      setMessages([]);
      return;
    }

    api.clearChatHistory(currentUser.user_id)
      .then(() => setMessages([]))
      .catch(error => setStatusMessage(error.response?.data?.error || "Failed to clear chat."));
  };

  const handleChatKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      askChatbot();
    }
  };

  const downloadReport = () => {
    if (!portfolioData) return;

    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(41, 128, 185);
    doc.text("Portfolio Risk Analysis Report", pageWidth / 2, 22, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, pageWidth / 2, 28, { align: "center" });

    const summaryY = 40;
    const boxHeight = 45;
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(245, 250, 250);
    doc.roundedRect(margin, summaryY, pageWidth - margin * 2, boxHeight, 6, 6, "F");

    doc.setFontSize(11);
    const leftColX = margin + 12;
    const rightColX = pageWidth / 2 + 12;
    doc.text(`Total Portfolio Value: ${formatCurrency(portfolioData.total_portfolio_value)}`, leftColX, summaryY + 20);
    doc.text(`Diversification: ${portfolioData.diversification}`, leftColX, summaryY + 36);
    doc.text(`Risk Score: ${portfolioData.risk_score}`, rightColX, summaryY + 20);
    doc.text(`Health Score: ${portfolioData.health_score}/100`, rightColX, summaryY + 36);

    const tableStart = summaryY + boxHeight + 24;

    autoTable(doc, {
      startY: tableStart,
      margin: { left: margin, right: margin },
      styles: { font: "helvetica", fontSize: 10, cellPadding: 8, overflow: "linebreak" },
      headStyles: { fillColor: [22, 160, 133], textColor: 255, halign: "center" },
      alternateRowStyles: { fillColor: [250, 250, 250] },
      theme: "grid",
      head: [["Type", "Name", "Qty / Units", "Invested Amount", "Price / NAV", "Current Value", "Allocation %", "Volatility"]],
      body: chartAssets.map(asset => [
        asset.asset_type,
        asset.asset_type === "Mutual Fund" ? asset.fund_name || asset.symbol : asset.symbol,
        asset.asset_type === "Mutual Fund" ? (asset.units != null ? asset.units : "-") : (asset.quantity != null ? asset.quantity : "-"),
        asset.investment_amount ? formatCurrency(asset.investment_amount) : "-",
        asset.asset_type === "Mutual Fund" ? (asset.nav != null ? asset.nav : "-") : (asset.latest_price != null ? asset.latest_price : "-"),
        asset.current_value ? formatCurrency(asset.current_value) : "-",
        asset.allocation_percentage != null ? `${asset.allocation_percentage}%` : "-",
        asset.volatility != null ? `${asset.volatility}%` : "-"
      ])
    });

    let currentY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 20 : tableStart + 180;

    if (Array.isArray(recommendations) && recommendations.length) {
      doc.setFontSize(13);
      doc.setFont("helvetica", "bold");
      doc.text("Recommendations", margin, currentY);
      currentY += 18;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      recommendations.forEach(r => {
        const lines = doc.splitTextToSize(`- ${r}`, pageWidth - margin * 2 - 20);
        doc.text(lines, margin + 12, currentY);
        currentY += lines.length * 14;
        if (currentY > 760) { doc.addPage(); currentY = margin; }
      });
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text("Generated by Portfolio Risk Analyzer", pageWidth / 2, 820, { align: "center" });

    doc.save("Portfolio_Report.pdf");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/50 text-slate-100 p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-5xl mb-8 md:mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg shadow-cyan-500/10 text-white">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-400 bg-clip-text text-transparent">
              Portfolio Risk Analyzer
            </h1>
          </div>
          <p className="text-slate-400 mt-2 text-sm md:text-base">
            AI-powered fintech companion for real-time asset analytics & risk modeling
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/60 border border-slate-800 text-xs font-semibold text-slate-400 w-fit">
          <ShieldCheck className="w-4 h-4 text-cyan-400" />
          <span>Secured Sandbox</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
        </div>
      </div>

      <div className="w-full max-w-5xl space-y-8">
        <UserPanel
          userForm={userForm}
          setUserForm={setUserForm}
          saveUser={saveUser}
          users={users}
          currentUser={currentUser}
          selectUser={selectUser}
          statusMessage={statusMessage}
        />

        <PortfolioForm
          portfolio={portfolio}
          handleCSVUpload={handleCSVUpload}
          handleChange={handleChange}
          addAssetField={addAssetField}
          analyzePortfolio={analyzePortfolio}
          saveCurrentPortfolio={saveCurrentPortfolio}
          loadSavedPortfolios={loadSavedPortfolios}
          statusMessage={statusMessage}
        />

        <SavedPortfolios
          savedPortfolios={savedPortfolios}
          loadPortfolio={loadPortfolio}
          deletePortfolio={deletePortfolio}
        />

        <Dashboard
          loading={loading}
          portfolioData={portfolioData}
          formatCurrency={formatCurrency}
          chartAssets={chartAssets}
          COLORS={COLORS}
          downloadReport={downloadReport}
          recommendations={recommendations}
        />

        {portfolioData && (
          <Chatbot
            currentUser={currentUser}
            messages={messages}
            question={question}
            setQuestion={setQuestion}
            askChatbot={askChatbot}
            clearChat={clearChat}
            chatLoading={chatLoading}
            handleChatKeyDown={handleChatKeyDown}
          />
        )}
      </div>
    </div>
  );
}

export default UserDashboard;

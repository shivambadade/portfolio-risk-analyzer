import React, { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import { Users, PieChart, Activity, CheckCircle, XCircle } from "lucide-react";

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminApi.get("/admin/dashboard")
      .then(res => setStats(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-slate-400">Loading dashboard...</div>;
  if (!stats) return <div className="text-red-400">Failed to load stats.</div>;

  const cards = [
    { title: "Total Users", value: stats.total_users, icon: Users, color: "text-blue-400", bg: "bg-blue-400/10" },
    { title: "Active Users", value: stats.active_users, icon: Activity, color: "text-emerald-400", bg: "bg-emerald-400/10" },
    { title: "Total Portfolios", value: stats.total_portfolios, icon: PieChart, color: "text-purple-400", bg: "bg-purple-400/10" },
    { title: "Today's Analyses", value: stats.todays_portfolio_analyses, icon: Activity, color: "text-orange-400", bg: "bg-orange-400/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, i) => (
          <div key={i} className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm flex items-start justify-between">
            <div>
              <p className="text-slate-400 text-sm font-medium">{card.title}</p>
              <h3 className="text-2xl font-bold text-slate-100 mt-2">{card.value}</h3>
            </div>
            <div className={`p-3 rounded-lg ${card.bg}`}>
              <card.icon className={`w-6 h-6 ${card.color}`} />
            </div>
          </div>
        ))}
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-slate-100 mb-4">System Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatusItem name="MongoDB" status={stats.mongodb_status} />
          <StatusItem name="Groq API" status={stats.groq_api_status} />
          <StatusItem name="Yahoo Finance" status={stats.yahoo_finance_status} />
        </div>
      </div>
    </div>
  );
};

const StatusItem = ({ name, status }) => {
  const isOperational = status === "Operational" || status === "Connected";
  return (
    <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-lg">
      <span className="text-slate-300 font-medium">{name}</span>
      <div className="flex items-center space-x-2">
        {isOperational ? <CheckCircle className="w-5 h-5 text-emerald-500" /> : <XCircle className="w-5 h-5 text-red-500" />}
        <span className={`text-sm ${isOperational ? 'text-emerald-400' : 'text-red-400'}`}>{status}</span>
      </div>
    </div>
  );
};

export default Dashboard;

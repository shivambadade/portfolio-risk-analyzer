import React from "react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { DollarSign, ShieldAlert, Layers, Heart, Download, Lightbulb, Activity, ArrowUpRight } from "lucide-react";

export default function Dashboard({
  loading,
  portfolioData,
  formatCurrency,
  chartAssets,
  COLORS,
  downloadReport,
  recommendations
}) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 glass-panel rounded-2xl max-w-5xl border border-slate-800 animate-pulse mb-8">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20" />
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500 border-t-transparent animate-spin" />
        </div>
        <p className="text-lg font-semibold text-cyan-400 tracking-wide">Analyzing Portfolio Risk Metrics...</p>
        <p className="text-slate-500 text-sm mt-1">Calculating standard deviation, allocation shares, and volatility indexes.</p>
      </div>
    );
  }

  if (!portfolioData) return null;

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl">
        {/* Metric 1 */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-emerald-500/10" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Value</span>
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-emerald-400 glow-emerald">
            {formatCurrency(portfolioData.total_portfolio_value)}
          </p>
          <span className="text-xs text-slate-500 mt-2 block">Aggregate assets valuation</span>
        </div>

        {/* Metric 2 */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-red-500/10" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Risk Score</span>
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg border border-red-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-red-400">
            {portfolioData.risk_score}
          </p>
          <span className="text-xs text-slate-500 mt-2 block">Weighted volatility threat index</span>
        </div>

        {/* Metric 3 */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-blue-500/10" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Diversification</span>
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg border border-blue-500/20">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-bold tracking-tight text-blue-400 truncate">
            {portfolioData.diversification}
          </p>
          <span className="text-xs text-slate-500 mt-2 block">Asset class distribution status</span>
        </div>

        {/* Metric 4 */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-bl-full pointer-events-none transition-all group-hover:bg-cyan-500/10" />
          <div className="flex justify-between items-start mb-4">
            <span className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Health Score</span>
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
              <Heart className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold tracking-tight text-cyan-400 glow-cyan">
            {portfolioData.health_score}/100
          </p>
          <span className="text-xs text-slate-500 mt-2 block">AI safety rating benchmark</span>
        </div>
      </div>

      {/* Visualizations & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl">
        {/* Pie Chart Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
              <Activity className="w-5 h-5" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-white">Asset Allocation Share</h2>
          </div>
          <div className="w-full h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartAssets}
                  dataKey="allocation_percentage"
                  nameKey="symbol"
                  outerRadius={95}
                  innerRadius={55}
                  paddingAngle={3}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {chartAssets.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      stroke="rgba(15, 23, 42, 0.8)"
                      strokeWidth={2}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "12px",
                    color: "#f8fafc"
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Portfolio Breakdown Table Card */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800/80">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold tracking-tight text-white">Portfolio Breakdown</h2>
            <button
              onClick={downloadReport}
              className="p-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-xs transition-all duration-150 flex items-center gap-2 active:scale-[0.98] shadow-lg shadow-purple-500/10"
            >
              <Download className="w-4 h-4" />
              <span>Export PDF</span>
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
            <div className="overflow-x-auto max-h-[280px]">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/60 sticky top-0 z-10">
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Asset Type</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Symbol</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Qty / Units</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Invested</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Value</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Allocation</th>
                    <th className="p-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">Volatility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/65">
                  {chartAssets.map((asset, index) => (
                    <tr
                      key={`${asset.symbol}-${index}`}
                      className="hover:bg-slate-900/40 transition-colors text-sm"
                    >
                      <td className="p-3 font-semibold text-slate-300">{asset.asset_type}</td>
                      <td className="p-3 text-cyan-400 font-mono font-medium">{asset.symbol}</td>
                      <td className="p-3 text-slate-400">{asset.quantity != null ? asset.quantity : "-"}</td>
                      <td className="p-3 text-slate-400">
                        {asset.investment_amount ? formatCurrency(asset.investment_amount) : "-"}
                      </td>
                      <td className="p-3 text-slate-200 font-medium">{formatCurrency(asset.current_value)}</td>
                      <td className="p-3">
                        <span className="inline-flex items-center px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-semibold">
                          {asset.allocation_percentage}%
                        </span>
                      </td>
                      <td className="p-3">
                        <span className="text-red-400 font-semibold">{asset.volatility}%</span>
                      </td>
                    </tr>
                  ))}
                  {chartAssets.length === 0 && (
                    <tr>
                      <td className="p-8 text-center text-slate-500" colSpan="7">
                        No assets found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* AI Recommendations Card */}
      <div className="glass-panel p-6 rounded-2xl max-w-5xl border border-slate-800/80">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-yellow-500/10 text-yellow-400 rounded-xl border border-yellow-500/20">
            <Lightbulb className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-white">Strategic AI Recommendations</h2>
            <p className="text-slate-400 text-sm mt-0.5">Automated asset allocation adjustments designed to optimize safety indices.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recommendations.map((item, index) => (
            <div
              key={index}
              className="bg-slate-900/60 p-4 rounded-xl border border-slate-800/85 hover:border-slate-800 transition-colors flex items-start gap-3.5"
            >
              <div className="p-1.5 rounded-lg bg-yellow-500/10 text-yellow-400 mt-0.5 border border-yellow-500/10">
                <ArrowUpRight className="w-4 h-4" />
              </div>
              <p className="text-slate-300 text-sm leading-relaxed">{item}</p>
            </div>
          ))}
          {recommendations.length === 0 && (
            <p className="text-slate-500 text-sm col-span-2">No recommendations available for the current holdings.</p>
          )}
        </div>
      </div>
    </div>
  );
}

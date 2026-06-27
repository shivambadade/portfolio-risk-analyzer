import React from "react";
import { Upload, Plus, Play, Save, FolderOpen, AlertCircle, FileText } from "lucide-react";

export default function PortfolioForm({
  portfolio,
  handleCSVUpload,
  handleChange,
  addAssetField,
  analyzePortfolio,
  saveCurrentPortfolio,
  loadSavedPortfolios,
  statusMessage
}) {
  return (
    <div className="glass-panel p-6 rounded-2xl shadow-xl mb-8 max-w-5xl border border-slate-800/80 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Portfolio Asset Entry</h2>
          <p className="text-slate-400 text-sm mt-1">
            Specify your assets manually or upload a CSV file with your holdings.
          </p>
        </div>

        {/* Upload Zone */}
        <div className="relative group cursor-pointer max-w-xs w-full">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 group-hover:border-cyan-500/50 transition-all duration-200">
            <Upload className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform duration-200" />
            <div className="text-left">
              <p className="text-xs font-semibold text-slate-300">Import CSV Portfolio</p>
              <p className="text-[10px] text-slate-500">Supports .csv files</p>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              className="absolute inset-0 opacity-0 cursor-pointer w-full"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {portfolio.map((asset, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-900/30 border border-slate-800/60 hover:border-slate-800 transition-colors"
          >
            {/* Asset Type */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Asset Type</label>
              <select
                value={asset.asset_type}
                onChange={(e) => handleChange(index, "asset_type", e.target.value)}
                className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 text-sm focus:outline-none focus:border-cyan-500/80 cursor-pointer transition-all"
              >
                <option>Stock</option>
                <option>Mutual Fund</option>
                <option>Forex</option>
                <option>Crypto</option>
              </select>
            </div>

            {/* Symbol / Ticker */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Symbol / Ticker</label>
              <input
                type="text"
                placeholder={
                  asset.asset_type === "Mutual Fund"
                    ? "e.g. 500209 (HDFC)"
                    : asset.asset_type === "Forex"
                    ? "e.g. USDINR"
                    : asset.asset_type === "Crypto"
                    ? "e.g. BTC-USD"
                    : "e.g. RELIANCE.NS"
                }
                value={asset.symbol}
                onChange={(e) => handleChange(index, "symbol", e.target.value)}
                className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 transition-all"
              />
            </div>

            {/* Quantity */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Quantity / Units</label>
              <input
                type="number"
                placeholder="0.00"
                value={asset.quantity}
                onChange={(e) => handleChange(index, "quantity", e.target.value)}
                className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 transition-all"
              />
            </div>

            {/* Invested Amount */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold tracking-wider text-slate-500 uppercase">Invested Amount (INR)</label>
              <input
                type="number"
                placeholder="0.00"
                step="0.01"
                value={asset.investment_amount}
                onChange={(e) => handleChange(index, "investment_amount", e.target.value)}
                className="p-3 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:border-cyan-500/80 transition-all"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3.5 mt-6 pt-6 border-t border-slate-800/80">
        <button
          onClick={addAssetField}
          className="px-5 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-medium text-sm transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>Add Asset Row</span>
        </button>

        <button
          onClick={analyzePortfolio}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-cyan-500/10 hover:shadow-cyan-500/25 transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Play className="w-4 h-4 fill-white" />
          <span>Analyze Portfolio</span>
        </button>

        <button
          onClick={saveCurrentPortfolio}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold text-sm shadow-lg shadow-emerald-500/10 hover:shadow-emerald-500/25 transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <Save className="w-4 h-4" />
          <span>Save Current</span>
        </button>

        <button
          onClick={loadSavedPortfolios}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-sm shadow-lg shadow-purple-500/10 hover:shadow-purple-500/25 transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98]"
        >
          <FolderOpen className="w-4 h-4" />
          <span>Refresh Saved List</span>
        </button>
      </div>

      {statusMessage && (
        <div className="mt-5 bg-cyan-500/10 border border-cyan-500/20 px-4 py-3 rounded-xl text-sm text-cyan-300 flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}

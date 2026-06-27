import React from "react";
import { FolderOpen, Calendar, Eye, Trash2 } from "lucide-react";

export default function SavedPortfolios({
  savedPortfolios,
  loadPortfolio,
  deletePortfolio
}) {
  return (
    <div className="glass-panel p-6 rounded-2xl shadow-xl mb-8 max-w-5xl border border-slate-800/80 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
          <FolderOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white font-sans">Saved Portfolios</h2>
          <p className="text-slate-400 text-sm mt-0.5">Access and compare previously saved analysis snapshots.</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/60">
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Portfolio ID</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">User Owner</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Created Date</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400">Total Holdings</th>
                <th className="p-4 text-xs font-bold uppercase tracking-wider text-slate-400 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {savedPortfolios.map((saved) => (
                <tr
                  key={saved.portfolio_id}
                  className="hover:bg-slate-850/40 transition-colors group"
                >
                  <td className="p-4 text-sm font-medium text-slate-300 font-mono">
                    #{saved.portfolio_id}
                  </td>
                  <td className="p-4 text-sm text-slate-300 font-medium">
                    {saved.user_name || "Unassigned"}
                  </td>
                  <td className="p-4 text-sm text-slate-400">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>{saved.created_at}</span>
                    </div>
                  </td>
                  <td className="p-4 text-sm">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-300 border border-purple-500/20">
                      {saved.holdings_count} assets
                    </span>
                  </td>
                  <td className="p-4 text-sm text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => loadPortfolio(saved.portfolio_id)}
                        className="p-2 rounded-lg bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white border border-blue-500/20 transition-all duration-150 flex items-center gap-1.5 text-xs font-medium"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Load</span>
                      </button>
                      <button
                        onClick={() => deletePortfolio(saved.portfolio_id)}
                        className="p-2 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/20 transition-all duration-150 flex items-center gap-1.5 text-xs font-medium"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {savedPortfolios.length === 0 && (
                <tr>
                  <td className="p-8 text-center text-slate-500" colSpan="5">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderOpen className="w-8 h-8 text-slate-700" />
                      <span className="text-sm">No saved portfolios found under this profile.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

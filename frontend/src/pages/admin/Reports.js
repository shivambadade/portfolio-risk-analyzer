import React from "react";
import { Download } from "lucide-react";

const Reports = () => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-100 mb-4">Export Reports</h3>
      <p className="text-slate-400 mb-6">Generate and download platform reports.</p>
      
      <div className="flex gap-4">
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700">
          <Download className="w-4 h-4 text-cyan-400" />
          Export Users (CSV)
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors border border-slate-700">
          <Download className="w-4 h-4 text-cyan-400" />
          Export Portfolios (PDF)
        </button>
      </div>
    </div>
  );
};

export default Reports;

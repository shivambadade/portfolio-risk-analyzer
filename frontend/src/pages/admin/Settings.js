import React, { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";

const Settings = () => {
  const [settings, setSettings] = useState(null);
  
  useEffect(() => {
    adminApi.get("/admin/settings")
      .then(res => setSettings(res.data))
      .catch(console.error);
  }, []);

  if (!settings) return <div className="text-slate-400">Loading settings...</div>;

  return (
    <div className="max-w-2xl bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-100 mb-6">System Settings</h3>
      
      <div className="space-y-4">
        <div className="flex justify-between items-center py-3 border-b border-slate-800">
          <span className="text-slate-400">Application Version</span>
          <span className="text-slate-200 font-medium">{settings.app_version}</span>
        </div>
        <div className="flex justify-between items-center py-3 border-b border-slate-800">
          <span className="text-slate-400">Environment</span>
          <span className="text-slate-200 font-medium">{settings.environment}</span>
        </div>
      </div>
    </div>
  );
};

export default Settings;

import React from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import { LayoutDashboard, Users, PieChart, FileText, Settings, LogOut, ShieldCheck } from "lucide-react";
import { useAdminAuth } from "../../context/AdminAuthContext";

const AdminLayout = () => {
  const { logout } = useAdminAuth();
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Users", path: "/admin/users", icon: Users },
    { name: "Analytics", path: "/admin/analytics", icon: PieChart },
    { name: "Reports", path: "/admin/reports", icon: FileText },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-200 font-sans">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <ShieldCheck className="w-6 h-6 text-cyan-400 mr-2" />
          <span className="text-lg font-bold text-slate-100">Admin Panel</span>
        </div>
        <nav className="flex-1 py-4">
          <ul className="space-y-1">
            {navItems.map((item) => (
              <li key={item.name}>
                <Link
                  to={item.path}
                  className={`flex items-center px-6 py-3 text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? "bg-slate-800 text-cyan-400 border-l-2 border-cyan-400"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-slate-200"
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button
            onClick={logout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-slate-400 rounded-md hover:bg-slate-800 hover:text-red-400 transition-colors"
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 md:px-8">
          <h2 className="text-xl font-semibold text-slate-100 capitalize">
            {location.pathname.split("/").pop() || "Dashboard"}
          </h2>
          <div className="flex items-center space-x-4">
             <div className="w-8 h-8 rounded-full bg-cyan-900/50 flex items-center justify-center border border-cyan-800">
                <span className="text-sm font-bold text-cyan-400">A</span>
             </div>
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-slate-950 p-6 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;

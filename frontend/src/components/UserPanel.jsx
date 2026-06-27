import React from "react";
import { User, Mail, UserPlus, ChevronDown } from "lucide-react";

export default function UserPanel({
  userForm,
  setUserForm,
  saveUser,
  users,
  currentUser,
  selectUser,
  statusMessage
}) {
  return (
    <div className="glass-panel p-6 rounded-2xl shadow-xl mb-8 max-w-5xl border border-slate-800/80 animate-fade-in-up">
      <div className="flex flex-col lg:flex-row lg:items-center gap-6 justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <User className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white">User Control Center</h2>
          </div>
          <p className="text-slate-400 text-sm">
            Enter your details below. Active user session automatically stores and connects your portfolios and AI chatbot history.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-[2] w-full lg:w-auto">
          <div className="relative">
            <User className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="text"
              placeholder="Full name"
              value={userForm.name}
              onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
              className="p-3 pl-11 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20 w-full transition-all duration-200"
            />
          </div>

          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 h-5 w-5 text-slate-400" />
            <input
              type="email"
              placeholder="Email address"
              value={userForm.email}
              onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
              className="p-3 pl-11 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500/80 focus:ring-1 focus:ring-blue-500/20 w-full transition-all duration-200"
            />
          </div>
        </div>

        <button
          onClick={saveUser}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium px-6 py-3.5 rounded-xl shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-150 flex items-center justify-center gap-2 w-full lg:w-auto"
        >
          <UserPlus className="w-5 h-5" />
          <span>Save User</span>
        </button>
      </div>

      <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="relative">
          <ChevronDown className="absolute right-4 top-4 h-5 w-5 text-slate-400 pointer-events-none" />
          <select
            value={currentUser?.user_id || ""}
            onChange={(e) => selectUser(e.target.value)}
            className="p-3.5 pr-10 rounded-xl bg-slate-900/60 border border-slate-800 text-slate-200 focus:outline-none focus:border-blue-500/80 w-full appearance-none transition-all duration-200 cursor-pointer"
          >
            <option value="">Select saved user profile</option>
            {users.map((user) => (
              <option key={user.user_id} value={user.user_id}>
                ID: {user.user_id} &bull; {user.name} ({user.email})
              </option>
            ))}
          </select>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/40 border border-slate-800/50 text-sm text-slate-300 w-full flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${currentUser ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-slate-600"}`} />
          {currentUser ? (
            <span className="font-medium text-slate-200">
              Active: <span className="text-blue-400 font-semibold">{currentUser.name}</span> <span className="text-slate-500">({currentUser.email})</span>
            </span>
          ) : (
            <span className="text-slate-500">No active user session selected</span>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="mt-5 bg-blue-500/10 border border-blue-500/20 px-4 py-3 rounded-xl text-sm text-blue-300 flex items-center gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-ping" />
          <span>{statusMessage}</span>
        </div>
      )}
    </div>
  );
}

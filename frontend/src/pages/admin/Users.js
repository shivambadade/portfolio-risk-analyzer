import React, { useEffect, useState } from "react";
import adminApi from "../../services/adminApi";
import { UserX, UserCheck, Trash2 } from "lucide-react";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    adminApi.get("/admin/users")
      .then(res => setUsers(res.data.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleStatus = (userId, isActive) => {
    adminApi.put(`/admin/user/${userId}`, { is_active: !isActive })
      .then(() => fetchUsers())
      .catch(console.error);
  };

  const deleteUser = (userId) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    adminApi.delete(`/admin/user/${userId}`)
      .then(() => fetchUsers())
      .catch(console.error);
  };

  if (loading) return <div className="text-slate-400">Loading users...</div>;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950/50 text-slate-400 text-sm border-b border-slate-800">
              <th className="px-6 py-4 font-medium">Name</th>
              <th className="px-6 py-4 font-medium">Email</th>
              <th className="px-6 py-4 font-medium">Role</th>
              <th className="px-6 py-4 font-medium">Status</th>
              <th className="px-6 py-4 font-medium">Created Date</th>
              <th className="px-6 py-4 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {users.map(user => (
              <tr key={user.user_id} className="hover:bg-slate-800/30 transition-colors">
                <td className="px-6 py-4 text-slate-200">{user.name}</td>
                <td className="px-6 py-4 text-slate-400">{user.email}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    user.role === 'superadmin' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                    user.role === 'admin' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                    'bg-slate-800 text-slate-300 border border-slate-700'
                  }`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    user.is_active !== false ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    {user.is_active !== false ? "Active" : "Suspended"}
                  </span>
                </td>
                <td className="px-6 py-4 text-slate-400 text-sm">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right space-x-3">
                  <button 
                    onClick={() => toggleStatus(user.user_id, user.is_active !== false)}
                    className="text-slate-400 hover:text-cyan-400 transition-colors"
                    title={user.is_active !== false ? "Suspend User" : "Activate User"}
                  >
                    {user.is_active !== false ? <UserX className="w-5 h-5" /> : <UserCheck className="w-5 h-5" />}
                  </button>
                  <button 
                    onClick={() => deleteUser(user.user_id)}
                    className="text-slate-400 hover:text-red-400 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No users found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;

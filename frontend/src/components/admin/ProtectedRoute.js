import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

const ProtectedRoute = () => {
  const { token, loading } = useAdminAuth();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-slate-950 text-white">Loading...</div>;
  }

  return token ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

export default ProtectedRoute;

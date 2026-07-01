import React, { createContext, useContext, useState, useEffect } from "react";
import adminApi from "../services/adminApi";

const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [adminUser, setAdminUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("adminToken"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      adminApi.get("/admin/dashboard")
        .then(() => {
          // Valid token, we just assume they are admin since we could hit this
          // A proper implementation might fetch /admin/me to get user details
          setAdminUser({ role: "admin" });
        })
        .catch(() => {
          logout();
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await adminApi.post("/admin/login", { email, password });
    const { token: newToken, user } = res.data;
    localStorage.setItem("adminToken", newToken);
    setToken(newToken);
    setAdminUser(user);
  };

  const logout = () => {
    localStorage.removeItem("adminToken");
    setToken(null);
    setAdminUser(null);
  };

  return (
    <AdminAuthContext.Provider value={{ adminUser, token, login, logout, loading }}>
      {children}
    </AdminAuthContext.Provider>
  );
};

export const useAdminAuth = () => useContext(AdminAuthContext);

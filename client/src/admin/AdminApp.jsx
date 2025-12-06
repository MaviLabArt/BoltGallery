import React, { useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./Login.jsx";
import Dashboard from "./Dashboard.jsx";
import Products from "./Products.jsx";
import Settings from "./Settings.jsx";
import { useAdmin } from "../store/useAdmin.js";

export default function AdminApp() {
  const { me } = useAdmin();
  const nav = useNavigate();

  useEffect(() => {
    me().then((ok) => {
      if (!ok && window.location.pathname !== "/admin") {
        nav("/admin");
      }
    }).catch(() => nav("/admin"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          <Route index element={<Login />} />
          <Route path="dashboard" element={<Dashboard />}>
            <Route index element={<Products />} />
            <Route path="products" element={<Products />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<div>Not Found</div>} />
        </Routes>
      </div>
    </div>
  );
}

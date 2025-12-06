import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import api from "../services/api.js";

export default function Dashboard() {
  const nav = useNavigate();

  async function logout() {
    await api.post("/admin/logout");
    nav("/admin");
  }

  const linkClass = ({ isActive }) => [
    "px-3 py-2 rounded-xl ring-1 ring-white/10",
    isActive ? "bg-white/10" : "bg-slate-900 hover:ring-white/30"
  ].join(" ");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="text-lg font-semibold">BoltGallery Admin</div>
        <div className="ml-auto flex items-center gap-2 text-sm">
          <NavLink to="/admin/dashboard/products" className={linkClass}>Products</NavLink>
          <NavLink to="/admin/dashboard/settings" className={linkClass}>Settings</NavLink>
          <button onClick={logout} className="px-3 py-2 rounded-xl ring-1 ring-white/10 bg-slate-900 hover:ring-white/30">Logout</button>
        </div>
      </div>
      <Outlet />
    </div>
  );
}

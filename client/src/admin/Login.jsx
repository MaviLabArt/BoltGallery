import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import AsyncButton from "../components/AsyncButton.jsx";
import api from "../services/api.js";

export default function Login() {
  const nav = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  async function submit() {
    try {
      setError("");
      await api.post("/admin/login", { pin });
      nav("/admin/dashboard");
    } catch (e) {
      setError("Invalid PIN");
    }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 rounded-3xl p-6 bg-slate-900 ring-1 ring-white/10">
      <div className="text-lg font-semibold mb-2">Admin Login</div>
      <input
        type="password"
        inputMode="numeric"
        value={pin}
        onChange={(e) => setPin(e.target.value)}
        placeholder="PIN"
        className="w-full px-4 py-3 rounded-2xl bg-slate-950 ring-1 ring-white/10"
        onKeyDown={(e) => e.key === "Enter" && submit()}
      />
      {error ? <div className="text-rose-200 text-sm mt-2">{error}</div> : null}
      <AsyncButton className="mt-4 w-full text-center justify-center" onClick={submit} busyText="Checking…">
        Sign in
      </AsyncButton>
    </div>
  );
}

import React, { useState } from "react";

export default function AsyncButton({ onClick, busyText = "Working...", children, className = "", ...rest }) {
  const [loading, setLoading] = useState(false);
  const handle = async (e) => {
    e?.preventDefault?.();
    if (loading) return;
    try {
      setLoading(true);
      await onClick(e);
    } finally {
      setLoading(false);
    }
  };
  return (
    <button
      type="button"
      className={["px-3 py-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 text-white", className, loading ? "opacity-70 cursor-not-allowed" : ""].filter(Boolean).join(" ")}
      onClick={handle}
      disabled={loading || rest.disabled}
      {...rest}
    >
      {loading ? busyText : children}
    </button>
  );
}

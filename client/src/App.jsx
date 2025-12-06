import React from "react";
import { Routes, Route } from "react-router-dom";
import Footer from "./components/Footer.jsx";
import Gallery from "./pages/Gallery.jsx";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 pt-6 sm:pt-8">
        <Routes>
          <Route index element={<Gallery />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

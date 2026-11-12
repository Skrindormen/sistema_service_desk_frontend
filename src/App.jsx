import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Agora a tela inicial vai direto para o Dashboard */}
        <Route path="/" element={<Dashboard />} />

        {/* Deixamos o login guardado nesta rota para usar depois */}
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

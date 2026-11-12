import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import logoFatec from "../assets/logo_fatec.jpg"; // Importação da logomarca

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  const realizarLogin = async (e) => {
    e.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      // Dispara a requisição para o backend no Render
      const resposta = await api.post("/auth/login", { email, senha });
      localStorage.setItem("accessToken", resposta.data.accessToken);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setErro("Falha na sincronização ou credenciais inválidas.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <div
      style={{
        display: "grid",
        placeItems: "center",
        minHeight: "100vh",
        padding: "20px",
      }}
    >
      <div
        className="panel"
        style={{
          padding: "40px",
          width: "100%",
          maxWidth: "400px",
          textAlign: "center",
        }}
      >
        {/* Logomarca da FATEC substituindo a letra F */}
        <img
          src={logoFatec}
          alt="Logo FATEC"
          style={{
            display: "block",
            margin: "0 auto 20px",
            height: "50px",
            objectFit: "contain",
          }}
        />

        <h1 style={{ marginBottom: "5px" }}>Service Desk</h1>
        <p style={{ color: "#7d8995", fontSize: "12px", marginBottom: "30px" }}>
          Insira suas credenciais para acessar o painel
        </p>

        {erro && (
          <div
            className="connection-notice"
            style={{ marginBottom: "20px", justifyContent: "center" }}
          >
            <span className="notice-icon">!</span>
            <p>{erro}</p>
          </div>
        )}

        <form
          onSubmit={realizarLogin}
          style={{ display: "grid", gap: "15px", textAlign: "left" }}
        >
          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "700",
                marginBottom: "5px",
              }}
            >
              E-MAIL
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              required
              style={{ width: "100%" }}
            />
          </div>

          <div>
            <label
              style={{
                display: "block",
                fontSize: "11px",
                fontWeight: "700",
                marginBottom: "5px",
              }}
            >
              SENHA
            </label>
            <input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="••••••••"
              required
              style={{ width: "100%" }}
            />
          </div>

          <button
            type="submit"
            className="button button-primary"
            style={{ width: "100%", marginTop: "10px" }}
            disabled={carregando}
          >
            {carregando ? "Conectando..." : "Entrar"}
          </button>
        </form>
      </div>
    </div>
  );
}

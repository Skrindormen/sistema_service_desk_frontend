import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
import logoFatec from "../assets/logo_fatec.jpg";

export default function Login() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);
  const navigate = useNavigate();

  async function realizarLogin(event) {
    event.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      const resposta = await api.post("/auth/login", { email, senha });
      localStorage.setItem("accessToken", resposta.data.accessToken);
      localStorage.setItem("currentUser", JSON.stringify(resposta.data.user));
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErro(
        error.response?.data?.message ||
          "Não foi possível entrar. Confira suas credenciais e tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card">
        <img className="login-logo" src={logoFatec} alt="FATEC Guarulhos" />
        <p className="eyebrow">FATEC GUARULHOS</p>
        <h1>Service Desk</h1>
        <p className="login-intro">
          Entre para abrir e acompanhar suas solicitações de suporte.
        </p>

        {erro && (
          <div className="form-error" role="alert">
            {erro}
          </div>
        )}

        <form className="form-stack" onSubmit={realizarLogin}>
          <label className="field">
            <span>E-mail</span>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              required
            />
          </label>

          <label className="field">
            <span>Senha</span>
            <input
              type="password"
              autoComplete="current-password"
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Sua senha"
              required
            />
          </label>

          <button className="button button-primary login-submit" type="submit" disabled={carregando}>
            {carregando ? "Conectando..." : "Entrar"}
          </button>
        </form>
      </section>
    </main>
  );
}

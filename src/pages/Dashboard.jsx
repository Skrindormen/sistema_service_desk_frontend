import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";
// Se quiser usar a logo da FATEC no menu também, pode importar aqui:
// import logoFatec from '../assets/logo_fatec.jpg';

export default function Dashboard() {
  const [chamados, setChamados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function carregarChamados() {
      try {
        // Vai buscar os chamados diretamente ao backend no Render
        const resposta = await api.get("/tickets");
        setChamados(resposta.data.data);
      } catch (erro) {
        console.error("Erro ao buscar chamados:", erro);
        // Se o token for inválido ou expirar, expulsa de volta para o Login
        if (
          erro.response &&
          (erro.response.status === 401 || erro.response.status === 403)
        ) {
          localStorage.removeItem("accessToken");
          navigate("/");
        }
      } finally {
        setCarregando(false);
      }
    }

    carregarChamados();
  }, [navigate]);

  const handleSair = () => {
    localStorage.removeItem("accessToken");
    navigate("/");
  };

  return (
    <div className="app-shell">
      {/* MENU PRINCIPAL (LATERAL) */}
      <aside className="sidebar">
        <div className="brand" style={{ paddingBottom: "20px" }}>
          {/* Pode trocar o "F" pela tag <img src={logoFatec} /> se preferir */}
          <div className="brand-mark">F</div>
          <div>
            FATEC <b>TI</b>
            <small>Service Desk</small>
          </div>
        </div>

        <nav>
          <button className="nav-link active">
            <span className="nav-icon">⌂</span>
            Visão geral
          </button>
          <button className="nav-link">
            <span className="nav-icon">≡</span>
            Chamados
          </button>
          <button className="nav-link">
            <span className="nav-icon">⚙</span>
            Equipamentos
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="avatar">U</div>
          <div>
            <strong>Minha Conta</strong>
            <small
              onClick={handleSair}
              style={{ cursor: "pointer", color: "var(--cor-vermelho)" }}
            >
              Sair do sistema
            </small>
          </div>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <main className="main-column">
        <header className="topbar">
          <div>
            <span className="topbar-kicker">SERVICE DESK</span>
            <strong>Visão geral</strong>
          </div>
        </header>

        <div className="content">
          <div className="welcome-row">
            <div>
              <p className="eyebrow">CENTRAL DE SUPORTE</p>
              <h1>
                Olá, equipe de <span>suporte</span> ✨
              </h1>
              <p>
                Acompanhe os chamados conectados diretamente ao banco de dados
                TiDB.
              </p>
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon amber">!</div>
              <div className="stat-label">Total de Chamados</div>
              <strong>{carregando ? "-" : chamados.length}</strong>
              <small>Registrados no sistema</small>
            </div>
          </div>

          <div className="panel table-panel">
            <div className="panel-heading">
              <h2>Últimas solicitações</h2>
            </div>

            <div className="table-wrap">
              {carregando ? (
                <p style={{ padding: "20px" }}>
                  Sincronizando com o backend...
                </p>
              ) : chamados.length === 0 ? (
                <p style={{ padding: "20px" }}>Nenhum chamado encontrado.</p>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>PROBLEMA</th>
                      <th>TIPO</th>
                      <th>PRIORIDADE</th>
                      <th>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chamados.map((chamado) => (
                      <tr key={chamado.id}>
                        <td className="ticket-id">#{chamado.id}</td>
                        <td>
                          <div className="problem-cell">
                            <strong>{chamado.titulo}</strong>
                            <small>{chamado.descricao}</small>
                          </div>
                        </td>
                        <td>{chamado.tipo}</td>
                        <td>
                          <span
                            className={`badge priority-${chamado.prioridade.toLowerCase()}`}
                          >
                            {chamado.prioridade}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`badge status-${chamado.status.toLowerCase().replace(" ", "-")}`}
                          >
                            {chamado.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

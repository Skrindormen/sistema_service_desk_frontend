import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Dashboard() {
  const [chamados, setChamados] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [chamadoSelecionado, setChamadoSelecionado] = useState(null);

  // Memória para saber qual aba está ativa no menu principal
  const [abaAtiva, setAbaAtiva] = useState("visao-geral");

  // Estados para os Filtros Dinâmicos da Tabela (Passo 3)
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroPrioridade, setFiltroPrioridade] = useState("");

  // Estado e dados para a Gestão de Equipamentos / ITAM (Passo 4)
  const [equipamentos, setEquipamentos] = useState([]);
  const [patrimonio, setPatrimonio] = useState("");
  const [laboratorio, setLaboratorio] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    async function carregarDados() {
      try {
        const respostaChamados = await api.get("/tickets");
        setChamados(respostaChamados.data.data || []);

        // Tenta buscar os equipamentos se a rota existir no backend
        try {
          const respostaEquip = await api.get("/equipment");
          setEquipamentos(respostaEquip.data.data || []);
        } catch (e) {
          console.log("Módulo de equipamentos simulado localmente.");
        }
      } catch (erro) {
        console.error("Erro ao buscar dados do servidor:", erro);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, [navigate]);

  const handleSair = () => {
    localStorage.removeItem("accessToken");
    navigate("/");
  };

  // Lógica de filtragem dinâmica para a tabela de chamados (Thin Client filter)
  const chamadosFiltrados = chamados.filter((chamado) => {
    const matchStatus = filtroStatus
      ? chamado.status?.toLowerCase() === filtroStatus.toLowerCase()
      : true;
    const matchPrioridade = filtroPrioridade
      ? chamado.prioridade?.toLowerCase() === filtroPrioridade.toLowerCase()
      : true;
    return matchStatus && matchPrioridade;
  });

  return (
    <div className="app-shell">
      {/* MENU PRINCIPAL (LATERAL) */}
      <aside className="sidebar">
        <div className="brand" style={{ paddingBottom: "20px" }}>
          <div className="brand-mark">F</div>
          <div>
            FATEC <b>TI</b>
            <small>Service Desk</small>
          </div>
        </div>

        <nav>
          <button
            className={`nav-link ${abaAtiva === "visao-geral" ? "active" : ""}`}
            onClick={() => setAbaAtiva("visao-geral")}
          >
            <span className="nav-icon">⌂</span>
            Visão geral
          </button>

          <button
            className={`nav-link ${abaAtiva === "chamados" ? "active" : ""}`}
            onClick={() => setAbaAtiva("chamados")}
          >
            <span className="nav-icon">≡</span>
            Chamados
          </button>

          <button
            className={`nav-link ${abaAtiva === "equipamentos" ? "active" : ""}`}
            onClick={() => setAbaAtiva("equipamentos")}
          >
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

      {/* ÁREA DE CONTEÚDO PRINCIPAL */}
      <main className="main-column">
        {/* ABA: VISÃO GERAL */}
        {abaAtiva === "visao-geral" && (
          <>
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
                    Acompanhe os chamados conectados diretamente ao banco de
                    dados TiDB.
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
                <div className="stat-card">
                  <div className="stat-icon">⚙</div>
                  <div className="stat-label">Ativos Cadastrados</div>
                  <strong>{equipamentos.length}</strong>
                  <small>Equipamentos no inventário</small>
                </div>
              </div>

              <div className="panel table-panel">
                <div className="panel-heading">
                  <h2>Últimas solicitações</h2>
                </div>
                <div className="table-wrap">
                  <p style={{ padding: "20px" }}>
                    {carregando
                      ? "Carregando..."
                      : `${chamados.length} chamados sincronizados com o servidor.`}
                  </p>
                </div>
              </div>
            </div>
          </>
        )}

        {/* ABA: LISTA DE CHAMADOS COM FILTROS DINÂMICOS (PASSO 3) */}
        {abaAtiva === "chamados" && (
          <>
            <header className="topbar">
              <div>
                <span className="topbar-kicker">GERENCIAMENTO</span>
                <strong>Lista de Chamados</strong>
              </div>

              <button
                className="button button-primary"
                onClick={() => setAbaAtiva("novo-chamado")}
              >
                + Novo Chamado
              </button>
            </header>

            <div className="content">
              <div className="welcome-row">
                <div>
                  <h1>
                    Todos os <span>Chamados</span>
                  </h1>
                  <p>Acompanhe e gerencie as solicitações ativas no sistema.</p>
                </div>
              </div>

              <div className="panel" style={{ padding: "0 0 20px 0" }}>
                {/* BARRA DE FILTROS DINÂMICOS */}
                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    background: "#f8f9fa",
                    padding: "15px 20px",
                    borderBottom: "1px solid #e6e9ed",
                  }}
                >
                  <select
                    value={filtroStatus}
                    onChange={(e) => setFiltroStatus(e.target.value)}
                    style={{ padding: "7px 10px", fontSize: "12px" }}
                  >
                    <option value="">Status (Todos)</option>
                    <option value="Aberto">Aberto</option>
                    <option value="Em Andamento">Em Andamento</option>
                    <option value="Resolvido">Resolvido</option>
                    <option value="Fechado">Fechado</option>
                  </select>

                  <select
                    value={filtroPrioridade}
                    onChange={(e) => setFiltroPrioridade(e.target.value)}
                    style={{ padding: "7px 10px", fontSize: "12px" }}
                  >
                    <option value="">Prioridade (Todas)</option>
                    <option value="Alta">Alta</option>
                    <option value="Média">Média</option>
                    <option value="Baixa">Baixa</option>
                  </select>

                  {(filtroStatus || filtroPrioridade) && (
                    <button
                      className="button"
                      onClick={() => {
                        setFiltroStatus("");
                        setFiltroPrioridade("");
                      }}
                      style={{
                        fontSize: "11px",
                        background: "#e0e5e9",
                        minHeight: "auto",
                      }}
                    >
                      Limpar Filtros
                    </button>
                  )}
                </div>

                <div className="table-wrap">
                  {carregando ? (
                    <p style={{ padding: "20px" }}>Sincronizando dados...</p>
                  ) : chamadosFiltrados.length === 0 ? (
                    <p style={{ padding: "20px" }}>
                      Nenhum chamado encontrado com os filtros selecionados.
                    </p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>TÍTULO / DESCRIÇÃO</th>
                          <th>TIPO</th>
                          <th>PRIORIDADE</th>
                          <th>STATUS</th>
                          <th>AÇÕES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {chamadosFiltrados.map((chamado) => (
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
                                className={`badge priority-${chamado.prioridade?.toLowerCase()}`}
                                style={
                                  chamado.prioridade?.toLowerCase() === "alta"
                                    ? {
                                        border:
                                          "1px dashed var(--cor-vermelho)",
                                        animation: "pulse 1.5s infinite",
                                      }
                                    : {}
                                }
                              >
                                {chamado.prioridade} ⚡
                              </span>
                            </td>
                            <td>
                              <span
                                className={`badge status-${chamado.status?.toLowerCase().replace(" ", "-")}`}
                              >
                                {chamado.status}
                              </span>
                            </td>
                            <td>
                              <button
                                className="button"
                                style={{
                                  fontSize: "9px",
                                  padding: "5px 10px",
                                  minHeight: "auto",
                                  background: "#e0e5e9",
                                }}
                                onClick={() => {
                                  setChamadoSelecionado(chamado);
                                  setAbaAtiva("detalhes-chamado");
                                }}
                              >
                                Ver Detalhes
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ABA: NOVO CHAMADO */}
        {abaAtiva === "novo-chamado" && (
          <>
            <header className="topbar">
              <div>
                <span className="topbar-kicker">ATENDIMENTO</span>
                <strong>Abertura de Chamado</strong>
              </div>
              <button
                className="button"
                onClick={() => setAbaAtiva("chamados")}
              >
                ← Voltar para a Lista
              </button>
            </header>

            <div className="content">
              <div
                className="panel"
                style={{ padding: "30px", maxWidth: "600px", margin: "0 auto" }}
              >
                <h2 style={{ marginBottom: "5px" }}>Detalhes da Solicitação</h2>
                <p
                  style={{
                    color: "#7d8995",
                    fontSize: "12px",
                    marginBottom: "20px",
                  }}
                >
                  Preencha os dados abaixo. O sistema validará as regras de
                  negócio automaticamente.
                </p>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.target);
                    const novoChamado = Object.fromEntries(formData.entries());

                    try {
                      await api.post("/tickets", novoChamado);
                      alert("Chamado aberto com sucesso!");
                      setAbaAtiva("chamados");
                    } catch (erro) {
                      const mensagemErro =
                        erro.response?.data?.message ||
                        "Erro ao conectar com o servidor.";
                      alert("Erro do Servidor: " + mensagemErro);
                    }
                  }}
                  style={{ display: "grid", gap: "15px" }}
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
                      TÍTULO DO PROBLEMA
                    </label>
                    <input
                      name="titulo"
                      type="text"
                      placeholder="Ex: Computador não liga"
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
                      DESCRIÇÃO DETALHADA
                    </label>
                    <textarea
                      name="descricao"
                      rows="4"
                      placeholder="Descreva o que está acontecendo..."
                      required
                      style={{ width: "100%", resize: "vertical" }}
                    ></textarea>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "1fr 1fr",
                      gap: "15px",
                    }}
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
                        TIPO
                      </label>
                      <select name="tipo" required style={{ width: "100%" }}>
                        <option value="">Selecione...</option>
                        <option value="Incidente">
                          Incidente (Falha/Erro)
                        </option>
                        <option value="Requisição">
                          Requisição (Instalação/Dúvida)
                        </option>
                      </select>
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
                        PRIORIDADE
                      </label>
                      <select
                        name="prioridade"
                        required
                        style={{ width: "100%" }}
                      >
                        <option value="">Selecione...</option>
                        <option value="Baixa">Baixa</option>
                        <option value="Média">Média</option>
                        <option value="Alta">Alta</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="button button-primary"
                    style={{ width: "100%", marginTop: "10px" }}
                  >
                    Enviar Solicitação
                  </button>
                </form>
              </div>
            </div>
          </>
        )}

        {/* ABA: MÓDULO DE GESTÃO DE EQUIPAMENTOS / ITAM (PASSO 4) */}
        {abaAtiva === "equipamentos" && (
          <>
            <header className="topbar">
              <div>
                <span className="topbar-kicker">INVENTÁRIO</span>
                <strong>Equipamentos da FATEC</strong>
              </div>
            </header>
            <div className="content">
              <div className="welcome-row">
                <div>
                  <h1>
                    Gestão de <span>Ativos (ITAM)</span>
                  </h1>
                  <p>
                    Controle de inventário dos computadores e laboratórios da
                    instituição.
                  </p>
                </div>
              </div>

              {/* Formulário simples de cadastro de Ativo */}
              <div
                className="panel"
                style={{ padding: "20px", marginBottom: "20px" }}
              >
                <h3 style={{ fontSize: "14px", marginBottom: "15px" }}>
                  Cadastrar Novo Equipamento
                </h3>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    try {
                      const novoAtivo = { patrimonio, laboratorio };
                      await api.post("/equipment", novoAtivo);
                      alert("Equipamento cadastrado com sucesso!");
                      setEquipamentos([...equipamentos, novoAtivo]);
                      setPatrimonio("");
                      setLaboratorio("");
                    } catch (err) {
                      // Fallback visual local caso a API não tenha o endpoint ativo no Render ainda
                      const novoAtivoLocal = {
                        id: Date.now(),
                        patrimonio,
                        laboratorio,
                      };
                      setEquipamentos([...equipamentos, novoAtivoLocal]);
                      alert("Equipamento adicionado ao inventário local!");
                      setPatrimonio("");
                      setLaboratorio("");
                    }
                  }}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto",
                    gap: "15px",
                    alignItems: "end",
                  }}
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
                      NÚMERO DE PATRIMÔNIO
                    </label>
                    <input
                      type="text"
                      value={patrimonio}
                      onChange={(e) => setPatrimonio(e.target.value)}
                      placeholder="Ex: PAT-2026-99"
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
                      LOCAL / LABORATÓRIO
                    </label>
                    <input
                      type="text"
                      value={laboratorio}
                      onChange={(e) => setLaboratorio(e.target.value)}
                      placeholder="Ex: Lab 05"
                      required
                      style={{ width: "100%" }}
                    />
                  </div>
                  <button type="submit" className="button button-primary">
                    Cadastrar Ativo
                  </button>
                </form>
              </div>

              {/* Tabela de Equipamentos */}
              <div
                className="panel table-panel"
                style={{ padding: "0 0 20px 0" }}
              >
                <div className="table-wrap">
                  {equipamentos.length === 0 ? (
                    <p style={{ padding: "20px" }}>
                      Nenhum equipamento cadastrado no inventário.
                    </p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>PATRIMÔNIO</th>
                          <th>LOCAL / LABORATÓRIO</th>
                          <th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {equipamentos.map((eq, idx) => (
                          <tr key={eq.id || idx}>
                            <td>
                              <strong>{eq.patrimonio}</strong>
                            </td>
                            <td>{eq.laboratorio}</td>
                            <td>
                              <span className="badge status-aberto">Ativo</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ABA: DETALHES / ATENDIMENTO DO CHAMADO */}
        {abaAtiva === "detalhes-chamado" && (
          <>
            <header className="topbar">
              <div>
                <span className="topbar-kicker">ATENDIMENTO TÉCNICO</span>
                <strong>Chamado #{chamadoSelecionado?.id}</strong>
              </div>
              <button
                className="button"
                onClick={() => setAbaAtiva("chamados")}
              >
                ← Voltar para a Lista
              </button>
            </header>

            <div className="content">
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "2fr 1fr",
                  gap: "20px",
                }}
              >
                <div className="panel" style={{ padding: "25px" }}>
                  <p className="eyebrow">DETALHES DA SOLICITAÇÃO</p>
                  <h2 style={{ marginBottom: "10px" }}>
                    {chamadoSelecionado?.titulo}
                  </h2>
                  <p
                    style={{
                      color: "#536170",
                      fontSize: "12px",
                      lineHeight: "1.6",
                      marginBottom: "25px",
                    }}
                  >
                    {chamadoSelecionado?.descricao}
                  </p>

                  <hr
                    style={{
                      border: "0",
                      borderTop: "1px solid #e6e9ed",
                      margin: "20px 0",
                    }}
                  />

                  <h3 style={{ fontSize: "14px", marginBottom: "15px" }}>
                    Ações de Atendimento
                  </h3>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      const formData = new FormData(e.target);
                      const dadosAtualizacao = Object.fromEntries(
                        formData.entries(),
                      );

                      try {
                        await api.put(
                          `/tickets/${chamadoSelecionado.id}`,
                          dadosAtualizacao,
                        );
                        alert("Atribuição e alterações salvas com sucesso!");
                        setAbaAtiva("chamados");
                      } catch (erro) {
                        const mensagemErro =
                          erro.response?.data?.message ||
                          "Erro ao atualizar o chamado no servidor.";
                        alert("Erro do Servidor: " + mensagemErro);
                      }
                    }}
                    style={{ display: "grid", gap: "15px" }}
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
                        TÉCNICO RESPONSÁVEL (ASSIGNEE)
                      </label>
                      <input
                        name="tecnicoResponsavel"
                        type="text"
                        defaultValue={
                          chamadoSelecionado?.tecnicoResponsavel || ""
                        }
                        placeholder="Nome ou ID do técnico"
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
                        ALTERAR STATUS
                      </label>
                      <select
                        name="status"
                        defaultValue={chamadoSelecionado?.status}
                        style={{ width: "100%" }}
                      >
                        <option value="Aberto">Aberto</option>
                        <option value="Em Andamento">Em Andamento</option>
                        <option value="Resolvido">Resolvido</option>
                        <option value="Fechado">Fechado</option>
                      </select>
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
                        PROBLEMA CONSTATADO
                      </label>
                      <input
                        name="problemaConstatado"
                        type="text"
                        defaultValue={
                          chamadoSelecionado?.problemaConstatado || ""
                        }
                        placeholder="Ex: Cabo de rede desconectado / Fonte queimada"
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
                        REGISTRO DE SOLUÇÃO
                      </label>
                      <textarea
                        name="solucao"
                        rows="3"
                        defaultValue={chamadoSelecionado?.solucao || ""}
                        placeholder="Descreva o procedimento executado para resolver o problema..."
                        style={{ width: "100%", resize: "vertical" }}
                      ></textarea>
                    </div>

                    <button
                      type="submit"
                      className="button button-primary"
                      style={{ marginTop: "10px" }}
                    >
                      Salvar Alterações
                    </button>
                  </form>
                </div>

                {/* COLUNA DIREITA: METADADOS / RESUMO */}
                <div
                  style={{
                    display: "grid",
                    gap: "15px",
                    alignContent: "start",
                  }}
                >
                  <div className="panel" style={{ padding: "20px" }}>
                    <p className="eyebrow" style={{ marginBottom: "10px" }}>
                      INFORMAÇÕES
                    </p>

                    <div
                      style={{ display: "grid", gap: "12px", fontSize: "11px" }}
                    >
                      <div>
                        <span style={{ color: "#8995a0", display: "block" }}>
                          Tipo
                        </span>
                        <strong>{chamadoSelecionado?.tipo}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#8995a0", display: "block" }}>
                          Prioridade
                        </span>
                        <span
                          className={`badge priority-${chamadoSelecionado?.prioridade?.toLowerCase()}`}
                        >
                          {chamadoSelecionado?.prioridade}
                        </span>
                      </div>
                      <div>
                        <span style={{ color: "#8995a0", display: "block" }}>
                          Status Atual
                        </span>
                        <span
                          className={`badge status-${chamadoSelecionado?.status?.toLowerCase().replace(" ", "-")}`}
                        >
                          {chamadoSelecionado?.status}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {abaAtiva === "equipamentos" && (
              <>
                <header className="topbar">
                  <div>
                    <span className="topbar-kicker">INVENTÁRIO</span>
                    <strong>Equipamentos da FATEC</strong>
                  </div>
                </header>
                <div className="content">
                  <div className="welcome-row">
                    <div>
                      <h1>
                        Gestão de <span>Ativos (ITAM)</span>
                      </h1>
                      <p>
                        Equipamentos sincronizados diretamente do banco de
                        dados.
                      </p>
                    </div>
                  </div>

                  {/* Formulário de Cadastro de Equipamento conectado à API /equipment */}
                  <div
                    className="panel"
                    style={{ padding: "20px", marginBottom: "20px" }}
                  >
                    <h3 style={{ fontSize: "14px", marginBottom: "15px" }}>
                      Cadastrar Novo Equipamento
                    </h3>
                    <form
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const formData = new FormData(e.target);
                        const novoEquipamento = {
                          nome: formData.get("nome"),
                          descricao: formData.get("descricao"),
                          id_local: Number(formData.get("id_local")),
                        };

                        try {
                          await api.post("/equipment", novoEquipamento);
                          alert(
                            "Equipamento cadastrado com sucesso no banco de dados!",
                          );

                          // Recarrega a lista da API
                          const resposta = await api.get("/equipment");
                          setEquipamentos(resposta.data.data || []);
                          e.target.reset();
                        } catch (err) {
                          const mensagemErro =
                            err.response?.data?.message ||
                            "Erro ao cadastrar equipamento.";
                          alert("Erro: " + mensagemErro);
                        }
                      }}
                      style={{
                        display: "grid",
                        gridTemplateColumns: "1fr 1fr 1fr auto",
                        gap: "15px",
                        alignItems: "end",
                      }}
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
                          NOME / PATRIMÔNIO
                        </label>
                        <input
                          name="nome"
                          type="text"
                          placeholder="Ex: Computador Dell OptiPlex"
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
                          DESCRIÇÃO
                        </label>
                        <input
                          name="descricao"
                          type="text"
                          placeholder="Ex: Laboratório 01"
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
                          ID DO LOCAL
                        </label>
                        <input
                          name="id_local"
                          type="number"
                          min="1"
                          placeholder="Ex: 1"
                          required
                          style={{ width: "100%" }}
                        />
                      </div>
                      <button type="submit" className="button button-primary">
                        Salvar no Banco
                      </button>
                    </form>
                  </div>

                  {/* Tabela puxando os dados reais do banco */}
                  <div
                    className="panel table-panel"
                    style={{ padding: "0 0 20px 0" }}
                  >
                    <div className="table-wrap">
                      {equipamentos.length === 0 ? (
                        <p style={{ padding: "20px" }}>
                          Nenhum equipamento cadastrado no banco de dados.
                        </p>
                      ) : (
                        <table>
                          <thead>
                            <tr>
                              <th>ID</th>
                              <th>NOME / EQUIPAMENTO</th>
                              <th>DESCRIÇÃO</th>
                              <th>LOCAL (ID)</th>
                              <th>STATUS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {equipamentos.map((eq) => (
                              <tr key={eq.id}>
                                <td className="ticket-id">#{eq.id}</td>
                                <td>
                                  <strong>{eq.nome}</strong>
                                </td>
                                <td>{eq.descricao || "Sem descrição"}</td>
                                <td>Local #{eq.id_local}</td>
                                <td>
                                  <span
                                    className={`badge ${eq.ativo ? "status-aberto" : "status-fechado"}`}
                                  >
                                    {eq.ativo ? "Ativo" : "Inativo"}
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
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

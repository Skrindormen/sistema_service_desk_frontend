import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listTickets, getTicket, listTicketComments,
  createTicket as postTicket, updateTicket as putTicket,
  cancelTicket as cancelTicketRequest, addTicketComment as postTicketComment,
} from "../services/tickets";
import {
  listEquipment, createEquipment as postEquipment,
  updateEquipment as putEquipment, deactivateEquipment as removeEquipment,
} from "../services/equipment";
import { listLocals } from "../services/locals";
import { nomePerfil } from "../auth/permissions";
import OverviewPage from "../components/OverviewPage";
import TicketsPage from "../components/TicketsPage";
import NewTicketPage from "../components/NewTicketPage";
import TicketDetailsPage from "../components/TicketDetailsPage";
import EquipmentPage from "../components/EquipmentPage";

const PAGE_SIZE = 10;
const EMPTY_PAGINATION = { page: 1, totalPages: 1, total: 0 };

function readCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser") || "null");
  } catch {
    return null;
  }
}

function responseMessage(error, fallback) {
  return error.response?.data?.message || fallback;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [user] = useState(readCurrentUser);
  const role = user?.tipo;
  const name = user?.nome || "Usuário";

  const [screen, setScreen] = useState("overview");
  const [tickets, setTickets] = useState([]);
  const [ticketPagination, setTicketPagination] = useState(EMPTY_PAGINATION);
  const [ticketPage, setTicketPage] = useState(1);
  const [titleInput, setTitleInput] = useState("");
  const [titleQuery, setTitleQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [ticketRefresh, setTicketRefresh] = useState(0);
  const [loadingTickets, setLoadingTickets] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [comments, setComments] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageError, setPageError] = useState("");
  const [notice, setNotice] = useState("");

  const [locals, setLocals] = useState([]);
  const [equipmentOptions, setEquipmentOptions] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [catalogError, setCatalogError] = useState("");

  const [equipmentList, setEquipmentList] = useState([]);
  const [equipmentPagination, setEquipmentPagination] = useState(EMPTY_PAGINATION);
  const [equipmentPage, setEquipmentPage] = useState(1);
  const [equipmentRefresh, setEquipmentRefresh] = useState(0);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [editingEquipmentId, setEditingEquipmentId] = useState(null);
  const [equipmentForm, setEquipmentForm] = useState({ nome: "", descricao: "", id_local: "" });


  const detailRequestId = useRef(0);


  useEffect(() => {
    if (!localStorage.getItem("accessToken") || !role) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("currentUser");
      navigate("/login", { replace: true });
    }
  }, [navigate, role]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setTitleQuery(titleInput.trim());
      setTicketPage(1);
    }, 300);
    return () => window.clearTimeout(timer);
  }, [titleInput]);

  useEffect(() => {
    if (!role || !localStorage.getItem("accessToken")) return undefined;
    const controller = new AbortController();
    const params = { page: ticketPage, limit: PAGE_SIZE };
    if (titleQuery) params.titulo = titleQuery;
    if (statusFilter) params.status = statusFilter;
    if (priorityFilter) params.prioridade = priorityFilter;

    setLoadingTickets(true);
    setPageError("");
    listTickets(params, controller.signal)
      .then((response) => {
        setTickets(response.items);
        const info = response.pagination || {};
        setTicketPagination({
          page: Number(info.page || ticketPage),
          totalPages: Math.max(1, Number(info.totalPages || 1)),
          total: Number(info.total || 0),
        });
      })
      .catch((error) => {
        if (error.code !== "ERR_CANCELED") {
          setPageError(responseMessage(error, "Não foi possível carregar os chamados."));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoadingTickets(false);
      });

    return () => controller.abort();
  }, [role, ticketPage, titleQuery, statusFilter, priorityFilter, ticketRefresh]);

  const loadCatalog = useCallback(async () => {
    setLoadingCatalog(true);
    setCatalogError("");
    const [localsResult, equipmentResult] = await Promise.allSettled([
      listLocals({ page: 1, limit: 100 }),
      listEquipment({ page: 1, limit: 100 }),
    ]);
    if (localsResult.status === "fulfilled") setLocals(localsResult.value.items);
    else {
      setLocals([]);
      setCatalogError(responseMessage(localsResult.reason, "Não foi possível carregar os locais."));
    }
    if (equipmentResult.status === "fulfilled") setEquipmentOptions(equipmentResult.value.items);
    else {
      setEquipmentOptions([]);
      setCatalogError((old) => old
        ? old + " A lista de equipamentos também não está disponível."
        : responseMessage(equipmentResult.reason, "Não foi possível carregar os equipamentos."));
    }
    setLoadingCatalog(false);
  }, []);

  const loadEquipmentList = useCallback(async () => {
    setLoadingEquipment(true);
    setPageError("");
    const [equipmentResult, localsResult] = await Promise.allSettled([
      listEquipment({ page: equipmentPage, limit: PAGE_SIZE }),
      listLocals({ page: 1, limit: 100 }),
    ]);
    if (equipmentResult.status === "fulfilled") {
      setEquipmentList(equipmentResult.value.items);
      const info = equipmentResult.value.pagination || {};
      setEquipmentPagination({
        page: Number(info.page || equipmentPage),
        totalPages: Math.max(1, Number(info.totalPages || 1)),
        total: Number(info.total || 0),
      });
    } else {
      setPageError(responseMessage(equipmentResult.reason, "Não foi possível carregar o inventário."));
      setEquipmentList([]);
    }
    if (localsResult.status === "fulfilled") setLocals(localsResult.value.items);
    else setPageError((old) => old || responseMessage(localsResult.reason, "Não foi possível carregar os locais."));
    setLoadingEquipment(false);
  }, [equipmentPage]);

  useEffect(() => {
    if (screen === "equipment" && role === "Admin") loadEquipmentList();
  }, [screen, role, equipmentPage, equipmentRefresh, loadEquipmentList]);

  const refreshTickets = useCallback(() => setTicketRefresh((value) => value + 1), []);
  const refreshEquipment = useCallback(() => setEquipmentRefresh((value) => value + 1), []);

  async function loadTicketDetails(ticketId) {
    const requestId = ++detailRequestId.current;
    setLoadingDetail(true);
    setLoadingComments(true);
    setPageError("");

    const [ticketResult, commentsResult] = await Promise.allSettled([
      getTicket(ticketId),
      listTicketComments(ticketId),
    ]);
    if (requestId !== detailRequestId.current) return;

    if (ticketResult.status === "fulfilled") {
      const ticket = ticketResult.value;
      if (ticket && !Array.isArray(ticket)) setSelectedTicket(ticket);
    } else {
      setPageError(responseMessage(ticketResult.reason, "Não foi possível abrir os detalhes deste chamado."));
    }
    if (commentsResult.status === "fulfilled") setComments(commentsResult.value);
    else {
      setComments([]);
      setPageError((old) => old || responseMessage(commentsResult.reason, "Não foi possível carregar os comentários."));
    }
    setLoadingDetail(false);
    setLoadingComments(false);
  }

  function openTicket(ticket) {
    setSelectedTicket(ticket);
    setComments([]);
    setScreen("ticket-detail");
    loadTicketDetails(ticket.id);
  }

  function logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("currentUser");
    navigate("/login", { replace: true });
  }

  async function createTicket(payload) {
    setSubmitting(true);
    setPageError("");
    setNotice("");
    try {
      await postTicket(payload);
      setScreen("tickets");
      setTitleInput("");
      setTitleQuery("");
      setStatusFilter("");
      setPriorityFilter("");
      setTicketPage(1);
      refreshTickets();
      setNotice("Chamado criado com sucesso.");
    } catch (error) {
      setPageError(responseMessage(error, "Não foi possível criar o chamado."));
    } finally {
      setSubmitting(false);
    }
  }

  async function updateTicket(event) {
    event.preventDefault();
    if (!selectedTicket) return;
    const data = new FormData(event.currentTarget);
    const payload = {
      status: data.get("status"),
      prioridade: data.get("prioridade"),
      nivel_atendimento: data.get("nivel_atendimento"),
    };
    const assigneeId = data.get("id_tecnico_atribuido");
    if (assigneeId) payload.id_tecnico_atribuido = Number(assigneeId);

    setSubmitting(true);
    setPageError("");
    setNotice("");
    try {
      await putTicket(selectedTicket.id, payload);
      setNotice("Alterações salvas.");
      refreshTickets();
      loadTicketDetails(selectedTicket.id);
    } catch (error) {
      setPageError(responseMessage(error, "Não foi possível atualizar o chamado."));
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelTicket(event) {
    event.preventDefault();
    if (!selectedTicket) return;
    const data = new FormData(event.currentTarget);
    setSubmitting(true);
    setPageError("");
    setNotice("");
    try {
      await cancelTicketRequest(selectedTicket.id, {
        justificativa: String(data.get("justificativa") || "").trim(),
      });
      setNotice("Chamado cancelado.");
      refreshTickets();
      loadTicketDetails(selectedTicket.id);
    } catch (error) {
      setPageError(responseMessage(error, "Não foi possível cancelar o chamado."));
    } finally {
      setSubmitting(false);
    }
  }

  async function addComment(event) {
    event.preventDefault();
    if (!selectedTicket) return;
    const form = event.currentTarget;
    const data = new FormData(form);
    const text = String(data.get("comentario") || "").trim();
    if (!text) return;
    setSubmitting(true);
    setPageError("");
    setNotice("");
    try {
      await postTicketComment(selectedTicket.id, { comentario: text });
      const response = await listTicketComments(selectedTicket.id);
      setComments(response);
      setNotice("Comentário registrado.");
      form.reset();
    } catch (error) {
      setPageError(responseMessage(error, "Não foi possível registrar o comentário."));
    } finally {
      setSubmitting(false);
    }
  }

  function updateEquipmentForm(event) {
    const { name, value } = event.target;
    setEquipmentForm((old) => ({ ...old, [name]: value }));
  }

  function editEquipment(item) {
    setEditingEquipmentId(item.id);
    setEquipmentForm({
      nome: item.nome || "",
      descricao: item.descricao || "",
      id_local: String(item.id_local || ""),
    });
  }

  function clearEquipmentForm() {
    setEditingEquipmentId(null);
    setEquipmentForm({ nome: "", descricao: "", id_local: "" });
  }

  async function saveEquipment(event) {
    event.preventDefault();
    const payload = {
      nome: equipmentForm.nome.trim(),
      descricao: equipmentForm.descricao.trim(),
      id_local: Number(equipmentForm.id_local),
    };
    setSubmitting(true);
    setPageError("");
    setNotice("");
    try {
      if (editingEquipmentId) {
        await putEquipment(editingEquipmentId, payload);
        setNotice("Equipamento atualizado.");
      } else {
        await postEquipment(payload);
        setNotice("Equipamento cadastrado.");
      }
      clearEquipmentForm();
      refreshEquipment();
    } catch (error) {
      setPageError(responseMessage(error, "Não foi possível salvar o equipamento."));
    } finally {
      setSubmitting(false);
    }
  }

  async function deactivateEquipment(item) {
    if (!window.confirm("Desativar " + item.nome + "?")) return;
    setPageError("");
    setNotice("");
    setSubmitting(true);
    try {
      await removeEquipment(item.id);
      setNotice("Equipamento desativado.");
      refreshEquipment();
    } catch (error) {
      setPageError(responseMessage(error, "Não foi possível desativar o equipamento."));
    } finally {
      setSubmitting(false);
    }
  }

  function openOverview() {
    setScreen("overview");
    setTicketPage(1);
    setTitleInput("");
    setTitleQuery("");
    setStatusFilter("");
    setPriorityFilter("");
  }
  function openNewTicket() {
    setPageError("");
    setNotice("");
    setScreen("new-ticket");
  }

  function openEquipment() {
    setPageError("");
    setNotice("");
    setEquipmentPage(1);
    setScreen("equipment");
  }

  const pageTitle = {
    overview: "Visão geral",
    tickets: "Chamados",
    "new-ticket": "Abrir chamado",
    "ticket-detail": "Detalhes do chamado",
    equipment: "Inventário de equipamentos",
  }[screen];

  if (!role) return null;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">F</div>
          <div className="brand-name">FATEC <b>TI</b><small>Service Desk</small></div>
        </div>
        <nav className="sidebar-nav" aria-label="Navegação principal">
          <button className={"nav-link " + (screen === "overview" ? "active" : "")} type="button" onClick={openOverview}><span className="nav-icon">⌂</span>Visão geral</button>
          <button className={"nav-link " + (["tickets", "ticket-detail", "new-ticket"].includes(screen) ? "active" : "")} type="button" onClick={() => setScreen("tickets")}><span className="nav-icon">≡</span>Chamados</button>
          {role === "Admin" && <button className={"nav-link " + (screen === "equipment" ? "active" : "")} type="button" onClick={openEquipment}><span className="nav-icon">◇</span>Equipamentos</button>}
        </nav>
        <div className="sidebar-account">
          <div className="avatar">{name.trim().charAt(0).toUpperCase() || "U"}</div>
          <div className="account-copy"><strong>{name}</strong><small>{nomePerfil(role)}</small><button className="signout-button" type="button" onClick={logout}>Sair do sistema</button></div>
        </div>
      </aside>

      <main className="main-column">
        <header className="topbar">
          <div><span className="topbar-kicker">SERVICE DESK</span><strong>{pageTitle}</strong></div>
          <div className="topbar-profile">
            <span className="role-pill">{nomePerfil(role)}</span>
            {["overview", "tickets"].includes(screen) && <button className="button button-primary" type="button" onClick={openNewTicket}>+ Novo chamado</button>}
          </div>
        </header>

        <div className="content">
          {pageError && <div className="notice notice-error" role="alert"><span className="notice-icon">!</span><span>{pageError}</span><button type="button" onClick={() => setPageError("")} aria-label="Fechar aviso">×</button></div>}
          {notice && <div className="notice notice-success" role="status"><span>{notice}</span><button type="button" onClick={() => setNotice("")} aria-label="Fechar aviso">×</button></div>}

          {screen === "overview" && <OverviewPage name={name} role={role} tickets={tickets} pagination={ticketPagination} loading={loadingTickets} onOpen={openTicket} onShowAll={() => setScreen("tickets")} onNewTicket={openNewTicket} />}
          {screen === "tickets" && <TicketsPage
            role={role}
            tickets={tickets}
            loading={loadingTickets}
            titleSearch={titleInput}
            status={statusFilter}
            priority={priorityFilter}
            pagination={ticketPagination}
            onTitleSearch={(value) => { setTitleInput(value); setTicketPage(1); }}
            onStatus={(value) => { setStatusFilter(value); setTicketPage(1); }}
            onPriority={(value) => { setPriorityFilter(value); setTicketPage(1); }}
            onPage={setTicketPage}
            onOpen={openTicket}
          />}
          {screen === "new-ticket" && <NewTicketPage
            role={role}
            locals={locals}
            equipment={equipmentOptions}
            catalogLoading={loadingCatalog}
            catalogError={catalogError}
            submitting={submitting}
            onNeedCatalog={loadCatalog}
            onSubmit={createTicket}
            onCancel={() => setScreen("tickets")}
          />}
          {screen === "ticket-detail" && <TicketDetailsPage
            ticket={selectedTicket}
            role={role}
            userId={user.id}
            comments={comments}
            loading={loadingDetail}
            loadingComments={loadingComments}
            submitting={submitting}
            onBack={() => setScreen("tickets")}
            onUpdate={updateTicket}
            onComment={addComment}
            onCancel={cancelTicket}
          />}
          {screen === "equipment" && role === "Admin" && <EquipmentPage
            equipment={equipmentList}
            locals={locals}
            loading={loadingEquipment}
            pagination={equipmentPagination}
            editingId={editingEquipmentId}
            form={equipmentForm}
            submitting={submitting}
            onRefresh={refreshEquipment}
            onEdit={editEquipment}
            onCancelEdit={clearEquipmentForm}
            onFormChange={updateEquipmentForm}
            onSave={saveEquipment}
            onDeactivate={deactivateEquipment}
            onPage={setEquipmentPage}
          />}
        </div>
      </main>
    </div>
  );
}

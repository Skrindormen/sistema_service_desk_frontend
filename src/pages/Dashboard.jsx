import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  listTickets, listAllTickets, getTicket, listTicketComments,
  createTicket as postTicket, updateTicket as putTicket,
  cancelTicket as cancelTicketRequest, addTicketComment as postTicketComment,
} from "../services/tickets";
import {
  listEquipment, listAllEquipment, createEquipment as postEquipment,
  updateEquipment as putEquipment, deactivateEquipment as removeEquipment,
} from "../services/equipment";
import { listLocals } from "../services/locals";
import { createUser as postUser, deleteUser as deleteUserRequest, listAllUsers } from "../services/users";
import { nomePerfil } from "../auth/permissions";
import OverviewPage from "../components/OverviewPage";
import TicketsPage from "../components/TicketsPage";
import NewTicketPage from "../components/NewTicketPage";
import TicketDetailsPage from "../components/TicketDetailsPage";
import EquipmentPage from "../components/EquipmentPage";
import UserManagementPage from "../components/UserManagementPage";
import DashboardsPage from "../components/DashboardsPage";

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
  const [users, setUsers] = useState([]);
  const [usersLoaded, setUsersLoaded] = useState(false);
  const [usersRefresh, setUsersRefresh] = useState(0);
  const [userBusy, setUserBusy] = useState(false);
  const [userListError, setUserListError] = useState("");
  const requesterNames = useMemo(() => {
    const names = new Map(users.map((item) => [String(item.id), item.nome]));
    if (user?.id && user.nome) names.set(String(user.id), user.nome);
    return names;
  }, [users, user]);

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

  const [dashboardTickets, setDashboardTickets] = useState([]);
  const [dashboardEquipment, setDashboardEquipment] = useState([]);
  const [dashboardLocals, setDashboardLocals] = useState([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [dashboardError, setDashboardError] = useState("");
  const [dashboardRefresh, setDashboardRefresh] = useState(0);


  const detailRequestId = useRef(0);


  useEffect(() => {
    if (!localStorage.getItem("accessToken") || !role) {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("currentUser");
      navigate("/login", { replace: true });
    }
  }, [navigate, role]);

  useEffect(() => {
    if (!role || role === "Usuario") return undefined;
    let active = true;
    const controller = new AbortController();
    listAllUsers({ signal: controller.signal })
      .then((result) => {
        if (active) {
          setUsers(result);
          setUserListError("");
        }
      })
      .catch((error) => {
        if (active) {
          setUsers([]);
          setUserListError(responseMessage(error, "Não foi possível carregar os usuários."));
        }
      })
      .finally(() => {
        if (active) setUsersLoaded(true);
      });
    return () => { active = false; controller.abort(); };
  }, [role, usersRefresh]);

  useEffect(() => {
    if (screen !== "dashboards" || !role) return undefined;
    let active = true;
    const controller = new AbortController();
    const ticketFilters = role === "N1" ? { nivel_atendimento: "N1" } : {};

    Promise.allSettled([
      listAllTickets(ticketFilters, controller.signal),
      listAllEquipment({ limit: 100, signal: controller.signal }),
      listLocals({ page: 1, limit: 100, signal: controller.signal }),
    ]).then(([ticketsResult, equipmentResult, localsResult]) => {
      if (!active) return;
      const errors = [];
      if (ticketsResult.status === "fulfilled") setDashboardTickets(ticketsResult.value);
      else {
        setDashboardTickets([]);
        errors.push(responseMessage(ticketsResult.reason, "Não foi possível carregar os chamados para os dashboards."));
      }
      if (equipmentResult.status === "fulfilled") setDashboardEquipment(equipmentResult.value);
      else {
        setDashboardEquipment([]);
        errors.push("A lista de equipamentos não está disponível; os dados por computador ficarão limitados.");
      }
      if (localsResult.status === "fulfilled") setDashboardLocals(localsResult.value.items);
      else {
        setDashboardLocals([]);
        errors.push("A lista de laboratórios não está disponível.");
      }
      setDashboardError(errors.join(" "));
      setDashboardLoading(false);
    });

    return () => {
      active = false;
      controller.abort();
    };
  }, [screen, role, dashboardRefresh]);

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

    listTickets(params, controller.signal)
      .then((response) => {
        setPageError("");
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
      listAllEquipment({ limit: 100 }),
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

  const loadEquipmentList = useCallback(async (signal) => {
    const [equipmentResult, localsResult] = await Promise.allSettled([
      listEquipment({ page: equipmentPage, limit: PAGE_SIZE, signal }),
      listLocals({ page: 1, limit: 100, signal }),
    ]);
    if (signal.aborted) return;
    const errors = [];
    if (equipmentResult.status === "fulfilled") {
      setEquipmentList(equipmentResult.value.items);
      const info = equipmentResult.value.pagination || {};
      setEquipmentPagination({
        page: Number(info.page || equipmentPage),
        totalPages: Math.max(1, Number(info.totalPages || 1)),
        total: Number(info.total || 0),
      });
    } else {
      errors.push(responseMessage(equipmentResult.reason, "Não foi possível carregar o inventário."));
      setEquipmentList([]);
    }
    if (localsResult.status === "fulfilled") setLocals(localsResult.value.items);
    else errors.push(responseMessage(localsResult.reason, "Não foi possível carregar os locais."));
    setPageError(errors.join(" "));
    setLoadingEquipment(false);
  }, [equipmentPage]);

  useEffect(() => {
    if (screen !== "equipment" || role !== "Admin") return undefined;
    const controller = new AbortController();
    Promise.resolve().then(() => loadEquipmentList(controller.signal));
    return () => controller.abort();
  }, [screen, role, equipmentPage, equipmentRefresh, loadEquipmentList]);

  const refreshTickets = useCallback(() => {
    setLoadingTickets(true);
    setPageError("");
    setTicketRefresh((value) => value + 1);
  }, []);
  const refreshEquipment = useCallback(() => {
    setLoadingEquipment(true);
    setPageError("");
    setEquipmentRefresh((value) => value + 1);
  }, []);

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

  function refreshUsers() {
    setUsersLoaded(false);
    setUserListError("");
    setUsersRefresh((value) => value + 1);
  }

  async function createUser(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const payload = {
      nome: String(data.get("nome") || "").trim(),
      email: String(data.get("email") || "").trim(),
      senha: String(data.get("senha") || ""),
      tipo: data.get("tipo"),
    };

    setUserBusy(true);
    setPageError("");
    setNotice("");
    try {
      await postUser(payload);
      form.reset();
      setNotice("Usuário cadastrado com sucesso.");
      refreshUsers();
    } catch (error) {
      setPageError(responseMessage(error, "Não foi possível cadastrar o usuário."));
    } finally {
      setUserBusy(false);
    }
  }

  async function deleteUser(item) {
    if (!window.confirm("Excluir o usuário " + item.nome + " (" + item.email + ")?")) return;
    setUserBusy(true);
    setPageError("");
    setNotice("");
    try {
      await deleteUserRequest(item.id);
      setNotice("Usuário excluído.");
      refreshUsers();
    } catch (error) {
      setPageError(responseMessage(error, "Não foi possível excluir o usuário."));
    } finally {
      setUserBusy(false);
    }
  }

  function openOverview() {
    setLoadingTickets(true);
    setPageError("");
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
    setLoadingEquipment(true);
    setEquipmentPage(1);
    setScreen("equipment");
  }

  function changeTicketPage(page) {
    setLoadingTickets(true);
    setPageError("");
    setTicketPage(page);
  }

  function changeTicketTitle(value) {
    setLoadingTickets(true);
    setPageError("");
    setTitleInput(value);
    setTicketPage(1);
  }

  function changeTicketStatus(value) {
    setLoadingTickets(true);
    setPageError("");
    setStatusFilter(value);
    setTicketPage(1);
  }

  function changeTicketPriority(value) {
    setLoadingTickets(true);
    setPageError("");
    setPriorityFilter(value);
    setTicketPage(1);
  }

  function changeEquipmentPage(page) {
    setLoadingEquipment(true);
    setPageError("");
    setEquipmentPage(page);
  }

  function openUsers() {
    setPageError("");
    setNotice("");
    setScreen("users");
  }

  function openDashboards() {
    setPageError("");
    setNotice("");
    setDashboardLoading(true);
    setScreen("dashboards");
  }

  function refreshDashboards() {
    setDashboardLoading(true);
    setDashboardRefresh((value) => value + 1);
  }

  const pageTitle = {
    overview: "Visão geral",
    tickets: "Chamados",
    "new-ticket": "Abrir chamado",
    "ticket-detail": "Detalhes do chamado",
    equipment: "Inventário de equipamentos",
    users: "Gestão de usuários",
    dashboards: "Dashboards",
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
          {role !== "Usuario" && <button className={"nav-link " + (screen === "dashboards" ? "active" : "")} type="button" onClick={openDashboards}><span className="nav-icon">▤</span>Dashboards</button>}
          {role === "Admin" && <button className={"nav-link " + (screen === "users" ? "active" : "")} type="button" onClick={openUsers}><span className="nav-icon">♙</span>Usuários</button>}
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

          {screen === "overview" && <OverviewPage name={name} role={role} tickets={tickets} pagination={ticketPagination} loading={loadingTickets} onOpen={openTicket} onShowAll={() => setScreen("tickets")} requesterNames={requesterNames} />}
          {screen === "tickets" && <TicketsPage
            role={role}
            tickets={tickets}
            loading={loadingTickets}
            titleSearch={titleInput}
            status={statusFilter}
            priority={priorityFilter}
            pagination={ticketPagination}
            onTitleSearch={changeTicketTitle}
            onStatus={changeTicketStatus}
            onPriority={changeTicketPriority}
            onPage={changeTicketPage}
            onOpen={openTicket}
            requesterNames={requesterNames}
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
            onPage={changeEquipmentPage}
          />}
          {screen === "users" && role === "Admin" && <UserManagementPage
            users={users}
            loading={!usersLoaded}
            busy={userBusy}
            error={userListError}
            onRefresh={refreshUsers}
            onCreate={createUser}
            onDelete={deleteUser}
          />}
          {screen === "dashboards" && role !== "Usuario" && <DashboardsPage
            role={role}
            tickets={dashboardTickets}
            equipment={dashboardEquipment}
            locals={dashboardLocals}
            users={users}
            loading={dashboardLoading}
            error={dashboardError}
            onRefresh={refreshDashboards}
          />}
        </div>
      </main>
    </div>
  );
}

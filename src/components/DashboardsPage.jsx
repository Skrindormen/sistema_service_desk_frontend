import { useMemo, useState } from "react";
import { listTicketComments } from "../services/tickets";
import { frontendLabName } from "../utils/labLocations";
import { filterDashboardTickets, parseDashboardDate } from "../utils/dashboardMetrics";

const EMPTY_FILTERS = {
  from: "",
  to: "",
  localId: "",
  equipmentId: "",
  type: "",
  level: "",
  priority: "",
  status: "",
  search: "",
};

function normalize(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function isResolved(ticket) {
  const status = normalize(ticket.status);
  return status === "fechado" || status === "resolvido" ||
    (Boolean(ticket.data_fechamento) && status !== "cancelado");
}

function rankBy(tickets, keyFor, labelFor) {
  const groups = new Map();
  for (const ticket of tickets) {
    const key = keyFor(ticket);
    if (key === undefined || key === null || key === "") continue;
    const normalizedKey = String(key);
    const current = groups.get(normalizedKey) || { label: labelFor(ticket), count: 0 };
    current.count += 1;
    groups.set(normalizedKey, current);
  }
  return [...groups.values()].sort((left, right) => right.count - left.count || left.label.localeCompare(right.label)).slice(0, 5);
}

function RankingList({ items, emptyText = "Sem dados para os filtros selecionados." }) {
  if (!items.length) return <p className="empty-state analytics-empty">{emptyText}</p>;
  const max = Math.max(...items.map((item) => item.count));
  return (
    <ol className="analytics-rank-list">
      {items.map((item, index) => (
        <li className="analytics-rank-item" key={item.label + index}>
          <div className="analytics-rank-label"><strong>{item.label}</strong><span>{item.count}</span></div>
          <div className="analytics-bar-track"><span style={{ width: (item.count / max * 100) + "%" }} /></div>
        </li>
      ))}
    </ol>
  );
}

function AnalyticsCard({ eyebrow, title, children, className = "" }) {
  return (
    <section className={"panel analytics-card " + className}>
      <div className="panel-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>
      {children}
    </section>
  );
}

function parseDateInput(value) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day || 1);
}

function makeMonthlySeries(tickets, filters) {
  const dated = tickets
    .map((ticket) => parseDashboardDate(ticket.data_abertura || ticket.created_at))
    .filter(Boolean);
  const latestTicket = dated.reduce((latest, date) => !latest || date > latest ? date : latest, null);
  const end = filters.to ? parseDateInput(filters.to) : latestTicket || new Date();
  const start = filters.from ? parseDateInput(filters.from) : new Date(end.getFullYear(), end.getMonth() - 5, 1);
  let startIndex = start.getFullYear() * 12 + start.getMonth();
  const endIndex = end.getFullYear() * 12 + end.getMonth();
  if (endIndex - startIndex > 11) startIndex = endIndex - 11;
  if (startIndex > endIndex) startIndex = endIndex;

  const groups = new Map();
  for (let index = startIndex; index <= endIndex; index += 1) {
    const year = Math.floor(index / 12);
    const month = index % 12;
    const key = year + "-" + String(month + 1).padStart(2, "0");
    const label = new Intl.DateTimeFormat("pt-BR", { month: "short" })
      .format(new Date(year, month, 1))
      .replace(".", "");
    groups.set(key, { label: label + (endIndex - startIndex > 6 ? "/" + String(year).slice(-2) : ""), count: 0 });
  }

  for (const ticket of tickets) {
    const date = parseDashboardDate(ticket.data_abertura || ticket.created_at);
    if (!date) continue;
    const key = date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
    if (groups.has(key)) groups.get(key).count += 1;
  }
  return [...groups.values()];
}

function MonthlyTrendChart({ series }) {
  if (!series.length) return <p className="empty-state analytics-empty">Sem datas de abertura disponíveis.</p>;
  const width = 640;
  const height = 230;
  const left = 38;
  const right = 14;
  const top = 18;
  const bottom = 36;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const max = Math.max(1, ...series.map((point) => point.count));
  const points = series.map((point, index) => ({
    ...point,
    x: left + (series.length === 1 ? plotWidth / 2 : index * plotWidth / (series.length - 1)),
    y: top + plotHeight - point.count / max * plotHeight,
  }));
  const linePath = points.map((point, index) => (index ? "L" : "M") + point.x + " " + point.y).join(" ");
  const areaPath = linePath + " L " + points[points.length - 1].x + " " + (top + plotHeight) +
    " L " + points[0].x + " " + (top + plotHeight) + " Z";

  return (
    <div className="trend-chart-wrap">
      <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Chamados abertos por mês">
        {[0, 0.5, 1].map((ratio) => {
          const y = top + plotHeight * ratio;
          const value = Math.round(max * (1 - ratio));
          return <g key={ratio}><line x1={left} y1={y} x2={width - right} y2={y} className="trend-grid-line" /><text x={left - 9} y={y + 4} textAnchor="end" className="trend-axis-label">{value}</text></g>;
        })}
        <path d={areaPath} className="trend-area" />
        <path d={linePath} className="trend-line" />
        {points.map((point) => (
          <g key={point.label + point.x}>
            <circle cx={point.x} cy={point.y} r="4" className="trend-point" />
            <text x={point.x} y={height - 12} textAnchor="middle" className="trend-axis-label">{point.label}</text>
          </g>
        ))}
      </svg>
      <p className="field-help">Quantidade de chamados agrupada pelo mês de abertura.</p>
    </div>
  );
}

function TypeDonutChart({ items }) {
  const total = items.reduce((sum, item) => sum + item.count, 0);
  if (!total) return <p className="empty-state analytics-empty">Sem tipos de chamado para os filtros selecionados.</p>;
  const circumference = 2 * Math.PI * 54;
  const colors = { Hardware: "var(--red)", Software: "var(--ink)" };
  const segments = items.reduce((currentSegments, item) => {
    const previous = currentSegments[currentSegments.length - 1];
    const offset = previous ? previous.offset + previous.length : 0;
    const length = item.count / total * circumference;
    return [...currentSegments, { ...item, offset, length }];
  }, []);

  return (
    <div className="donut-layout">
      <div className="donut-visual">
        <svg viewBox="0 0 140 140" role="img" aria-label="Distribuição de chamados por tipo">
          <circle className="donut-track" cx="70" cy="70" r="54" />
          <g transform="rotate(-90 70 70)">
            {segments.map((item) => <circle key={item.label} cx="70" cy="70" r="54" fill="none" stroke={colors[item.label] || "#d4a45e"} strokeWidth="18" strokeDasharray={`${item.length} ${circumference - item.length}`} strokeDashoffset={-item.offset} />)}
          </g>
        </svg>
        <div className="donut-center"><strong>{total}</strong><span>chamados</span></div>
      </div>
      <ul className="donut-legend">
        {items.map((item) => <li key={item.label}><span className="donut-legend-dot" style={{ background: colors[item.label] || "#d4a45e" }} /><span>{item.label}</span><strong>{item.count}</strong></li>)}
      </ul>
    </div>
  );
}

function StatusStackedChart({ tickets }) {
  const rows = [
    { label: "Abertos", count: tickets.filter((ticket) => ticket.status === "Aberto").length, color: "var(--red)" },
    { label: "Em andamento", count: tickets.filter((ticket) => ticket.status === "Em andamento").length, color: "var(--ink)" },
    { label: "Fechados", count: tickets.filter(isResolved).length, color: "#d4a45e" },
    { label: "Cancelados", count: tickets.filter((ticket) => ticket.status === "Cancelado").length, color: "#c6cdd2" },
  ];
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (!total) return <p className="empty-state analytics-empty">Sem status para os filtros selecionados.</p>;
  return (
    <div className="status-chart">
      <div className="status-stack" role="img" aria-label={rows.map((row) => row.label + ": " + row.count).join(", ")}>
        {rows.filter((row) => row.count > 0).map((row) => <span key={row.label} style={{ width: (row.count / total * 100) + "%", background: row.color }} title={row.label + ": " + row.count} />)}
      </div>
      <ul className="status-chart-legend">
        {rows.map((row) => <li key={row.label}><span className="donut-legend-dot" style={{ background: row.color }} /><span>{row.label}</span><strong>{row.count}</strong></li>)}
      </ul>
    </div>
  );
}

function WeekdayChart({ tickets }) {
  const labels = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
  const counts = Array(7).fill(0);
  for (const ticket of tickets) {
    const date = parseDashboardDate(ticket.data_abertura || ticket.created_at);
    if (!date) continue;
    counts[(date.getDay() + 6) % 7] += 1;
  }
  const max = Math.max(1, ...counts);
  return (
    <div className="weekday-chart" role="img" aria-label="Chamados por dia da semana">
      {labels.map((label, index) => (
        <div className="weekday-column" key={label} title={label + ": " + counts[index]}>
          <strong>{counts[index]}</strong>
          <div className="weekday-bar-track"><span style={{ height: (counts[index] / max * 100) + "%" }} /></div>
          <small>{label}</small>
        </div>
      ))}
    </div>
  );
}

export default function DashboardsPage({ role, tickets, equipment, locals, users, loading, error, onRefresh }) {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [solutionComments, setSolutionComments] = useState({});
  const [solutionLoading, setSolutionLoading] = useState(false);
  const [solutionProgress, setSolutionProgress] = useState({ completed: 0, total: 0 });
  const [solutionError, setSolutionError] = useState("");
  const levelFilterEnabled = role === "N2" || role === "Admin";
  const rangeError = Boolean(filters.from && filters.to && filters.from > filters.to);

  function updateFilter(event) {
    const { name, value } = event.target;
    setFilters((current) => ({ ...current, [name]: value }));
  }

  const filteredTickets = useMemo(() => {
    if (rangeError) return [];
    return filterDashboardTickets(tickets, role, filters);
  }, [tickets, role, filters, rangeError]);

  const localById = useMemo(() => new Map(locals.map((local) => [String(local.id), local])), [locals]);
  const equipmentById = useMemo(() => new Map(equipment.map((item) => [String(item.id), item])), [equipment]);
  const userById = useMemo(() => new Map(users.map((item) => [String(item.id), item])), [users]);
  const resolvedTickets = useMemo(() => filteredTickets.filter(isResolved), [filteredTickets]);
  const openCount = filteredTickets.filter((ticket) => ticket.status === "Aberto").length;
  const inProgressCount = filteredTickets.filter((ticket) => ticket.status === "Em andamento").length;
  const resolvedCount = resolvedTickets.length;

  const byLocal = useMemo(() => rankBy(
    filteredTickets,
    (ticket) => ticket.id_local || "no-local",
    (ticket) => {
      const local = localById.get(String(ticket.id_local));
      return local ? frontendLabName(local) : ticket.id_local ? "Local #" + ticket.id_local : "Sem local associado";
    },
  ), [filteredTickets, localById]);

  const byEquipment = useMemo(() => rankBy(
    filteredTickets,
    (ticket) => ticket.id_equipamento,
    (ticket) => {
      const item = equipmentById.get(String(ticket.id_equipamento));
      return item?.nome || "Equipamento #" + ticket.id_equipamento;
    },
  ), [filteredTickets, equipmentById]);

  const byProblem = useMemo(() => rankBy(
    filteredTickets,
    (ticket) => normalize(ticket.titulo) || "sem-titulo",
    (ticket) => ticket.titulo || "Sem título informado",
  ), [filteredTickets]);

  const byType = useMemo(() => rankBy(
    filteredTickets,
    (ticket) => ticket.tipo || "sem-tipo",
    (ticket) => ticket.tipo || "Sem tipo informado",
  ), [filteredTickets]);

  const filterFrom = filters.from;
  const filterTo = filters.to;
  const monthlySeries = useMemo(
    () => makeMonthlySeries(filteredTickets, { from: filterFrom, to: filterTo }),
    [filteredTickets, filterFrom, filterTo],
  );

  const byTechnician = useMemo(() => rankBy(
    resolvedTickets.filter((ticket) => ticket.id_tecnico_resolucao),
    (ticket) => ticket.id_tecnico_resolucao,
    (ticket) => userById.get(String(ticket.id_tecnico_resolucao))?.nome ||
      "Técnico #" + ticket.id_tecnico_resolucao,
  ), [resolvedTickets, userById]);

  const solutionTicketsToLoad = resolvedTickets.filter((ticket) =>
    ticket.id_tecnico_resolucao && !Object.prototype.hasOwnProperty.call(solutionComments, String(ticket.id)),
  );
  const bySolution = useMemo(() => {
    const groups = new Map();
    for (const ticket of resolvedTickets) {
      const notes = solutionComments[String(ticket.id)] || [];
      for (const comment of notes) {
        const key = normalize(comment);
        if (!key) continue;
        const current = groups.get(key) || { label: comment, count: 0 };
        current.count += 1;
        groups.set(key, current);
      }
    }
    return [...groups.values()]
      .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label))
      .slice(0, 5);
  }, [resolvedTickets, solutionComments]);

  async function loadResolutionComments() {
    const pending = solutionTicketsToLoad;
    if (!pending.length || solutionLoading) return;
    setSolutionLoading(true);
    setSolutionError("");
    setSolutionProgress({ completed: 0, total: pending.length });
    const loaded = {};
    const failed = [];
    let nextIndex = 0;
    let completed = 0;

    async function worker() {
      while (nextIndex < pending.length) {
        const ticket = pending[nextIndex];
        nextIndex += 1;
        try {
          const comments = await listTicketComments(ticket.id);
          loaded[String(ticket.id)] = comments
            .filter((comment) => String(comment.id_usuario) === String(ticket.id_tecnico_resolucao))
            .map((comment) => String(comment.comentario || "").trim())
            .filter(Boolean);
        } catch {
          failed.push(ticket.id);
        }
        completed += 1;
        setSolutionProgress({ completed, total: pending.length });
      }
    }

    await Promise.all(Array.from({ length: Math.min(4, pending.length) }, () => worker()));
    setSolutionComments((current) => ({ ...current, ...loaded }));
    if (failed.length) setSolutionError("Não foi possível carregar comentários de " + failed.length + " chamado(s). Tente novamente.");
    setSolutionLoading(false);
  }

  const levelDescription = role === "N1"
    ? "O painel mostra somente chamados do nível N1, conforme o escopo do perfil."
    : role === "N2"
      ? "O painel inclui chamados dos níveis N1 e N2; use o filtro para selecionar um nível."
      : "O painel inclui todos os níveis e dados disponíveis para a administração.";

  return (
    <>
      <section className="welcome-row analytics-heading">
        <div><p className="eyebrow">ANÁLISE OPERACIONAL</p><h1>Dashboards</h1><p>{levelDescription}</p></div>
        <button className="button button-muted" type="button" onClick={onRefresh} disabled={loading}>{loading ? "Atualizando..." : "Atualizar dados"}</button>
      </section>

      {error && <div className="notice notice-error" role="alert">{error}</div>}
      {loading && <p className="field-help analytics-loading">Carregando chamados, laboratórios e equipamentos...</p>}

      <section className="panel detail-card analytics-filters">
        <div className="panel-heading"><div><p className="eyebrow">FILTROS</p><h2>Período e escopo</h2></div><button className="text-button" type="button" onClick={() => setFilters(EMPTY_FILTERS)}>Limpar filtros</button></div>
        <div className="analytics-filter-grid">
          <label className="field"><span>Data inicial</span><input type="date" name="from" value={filters.from} onChange={updateFilter} /></label>
          <label className="field"><span>Data final</span><input type="date" name="to" value={filters.to} onChange={updateFilter} /></label>
          <label className="field">
            <span>Laboratório / local</span>
            <select name="localId" value={filters.localId} onChange={updateFilter}>
              <option value="">Todos os locais</option>
              {locals.map((local) => <option key={local.id} value={local.id}>{frontendLabName(local)}</option>)}
            </select>
          </label>
          <label className="field">
            <span>Tipo de problema</span>
            <select name="type" value={filters.type} onChange={updateFilter}>
              <option value="">Todos os tipos</option>
              <option value="Hardware">Hardware</option>
              <option value="Software">Software</option>
            </select>
          </label>
          {levelFilterEnabled ? (
            <label className="field">
              <span>Nível de atendimento</span>
              <select name="level" value={filters.level} onChange={updateFilter}>
                <option value="">Todos os níveis</option>
                <option value="N1">N1</option>
                <option value="N2">N2</option>
              </select>
            </label>
          ) : (
            <label className="field"><span>Nível de atendimento</span><input value="N1 (escopo do perfil)" readOnly /></label>
          )}
          <label className="field">
            <span>Computador</span>
            <select name="equipmentId" value={filters.equipmentId} onChange={updateFilter}>
              <option value="">Todos os computadores</option>
              {equipment.map((item) => {
                const local = localById.get(String(item.id_local));
                return <option key={item.id} value={item.id}>{item.nome}{local ? " — " + frontendLabName(local) : ""}</option>;
              })}
            </select>
          </label>
          <label className="field">
            <span>Prioridade</span>
            <select name="priority" value={filters.priority} onChange={updateFilter}>
              <option value="">Todas</option>
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </label>
          <label className="field">
            <span>Status</span>
            <select name="status" value={filters.status} onChange={updateFilter}>
              <option value="">Todos</option>
              <option value="Aberto">Aberto</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Fechado">Fechado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </label>
          <label className="field analytics-search"><span>Buscar problema</span><input type="search" name="search" value={filters.search} onChange={updateFilter} placeholder="Título ou descrição" /></label>
        </div>
        {rangeError && <p className="field-error">A data inicial deve ser anterior ou igual à data final.</p>}
        <p className="field-help">{filteredTickets.length} chamados após os filtros, de {tickets.length} recebidos da API. As datas são filtradas no navegador porque a API não oferece parâmetros de período.</p>
      </section>

      <section className="analytics-stats-grid" aria-label="Indicadores de chamados">
        <article className="stat-card"><div className="stat-icon">≡</div><div className="stat-label">Chamados no período</div><strong>{loading ? "—" : filteredTickets.length}</strong><small>Após os filtros selecionados</small></article>
        <article className="stat-card"><div className="stat-icon stat-icon-red">◷</div><div className="stat-label">Abertos</div><strong>{loading ? "—" : openCount}</strong><small>No escopo atual</small></article>
        <article className="stat-card"><div className="stat-icon stat-icon-dark">↻</div><div className="stat-label">Em andamento</div><strong>{loading ? "—" : inProgressCount}</strong><small>No escopo atual</small></article>
        <article className="stat-card"><div className="stat-icon">✓</div><div className="stat-label">Encerrados</div><strong>{loading ? "—" : resolvedCount}</strong><small>Fechados ou resolvidos</small></article>
      </section>

      <div className="analytics-grid">
        <AnalyticsCard eyebrow="TENDÊNCIA" title="Abertura de chamados ao longo do tempo" className="analytics-card-wide">
          <MonthlyTrendChart series={monthlySeries} />
        </AnalyticsCard>
        <AnalyticsCard eyebrow="DISTRIBUIÇÃO" title="Chamados por tipo">
          <TypeDonutChart items={byType} />
        </AnalyticsCard>
        <AnalyticsCard eyebrow="SITUAÇÃO" title="Composição por status">
          <StatusStackedChart tickets={filteredTickets} />
        </AnalyticsCard>
        <AnalyticsCard eyebrow="SAZONALIDADE" title="Chamados por dia da semana">
          <WeekdayChart tickets={filteredTickets} />
        </AnalyticsCard>
        <AnalyticsCard eyebrow="LOCAIS" title="Laboratórios com mais chamados"><RankingList items={byLocal} /></AnalyticsCard>
        <AnalyticsCard eyebrow="ATIVOS" title="Computadores com mais chamados"><RankingList items={byEquipment} emptyText="Não há chamados vinculados a computadores nos filtros selecionados." /></AnalyticsCard>
        <AnalyticsCard eyebrow="RECORRÊNCIA" title="Problemas mais frequentes"><RankingList items={byProblem} /></AnalyticsCard>
        {role === "Admin" && <AnalyticsCard eyebrow="RESOLUÇÕES" title="Técnicos com mais resoluções"><RankingList items={byTechnician} emptyText="Não há chamados encerrados com técnico resolutor identificado." /></AnalyticsCard>}
        {role === "Admin" && (
          <AnalyticsCard eyebrow="SOLUÇÕES" title="Soluções mais frequentes" className="analytics-solutions-card">
            <p className="field-help">A API não tem um campo estruturado de solução. O levantamento agrupa comentários dos técnicos registrados como responsáveis pela resolução.</p>
            <div className="analytics-solution-actions">
              <button className="button button-muted" type="button" onClick={loadResolutionComments} disabled={solutionLoading || !solutionTicketsToLoad.length}>
                {solutionLoading
                  ? "Lendo comentários... " + solutionProgress.completed + "/" + solutionProgress.total
                  : solutionTicketsToLoad.length
                    ? "Analisar comentários de " + solutionTicketsToLoad.length + " chamados"
                    : resolvedTickets.length
                      ? "Comentários analisados"
                      : "Sem chamados encerrados no filtro"}
              </button>
            </div>
            {solutionError && <p className="field-error">{solutionError}</p>}
            <RankingList items={bySolution} emptyText="Ainda não há comentários de resolução carregados para este filtro." />
          </AnalyticsCard>
        )}
      </div>
    </>
  );
}

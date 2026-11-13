function normalize(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

export function parseDashboardDate(value) {
  if (!value) return "";
  const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(value).trim());
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (date.getFullYear() !== Number(year) || date.getMonth() !== Number(month) - 1 || date.getDate() !== Number(day)) return null;
    return date;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dayKey(value) {
  const date = parseDashboardDate(value);
  if (!date) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

export function filterDashboardTickets(tickets, role, filters = {}) {
  if (filters.from && filters.to && filters.from > filters.to) return [];
  const search = normalize(filters.search);
  const canSelectLevel = role === "N2" || role === "Admin";

  return tickets.filter((ticket) => {
    if (role === "N1" && ticket.nivel_atendimento !== "N1") return false;
    if (filters.from || filters.to) {
      const opened = dayKey(ticket.data_abertura || ticket.created_at);
      if (!opened || (filters.from && opened < filters.from) || (filters.to && opened > filters.to)) return false;
    }
    if (filters.localId && String(ticket.id_local || "") !== String(filters.localId)) return false;
    if (filters.equipmentId && String(ticket.id_equipamento || "") !== String(filters.equipmentId)) return false;
    if (filters.type && ticket.tipo !== filters.type) return false;
    if (canSelectLevel && filters.level && ticket.nivel_atendimento !== filters.level) return false;
    if (filters.priority && ticket.prioridade !== filters.priority) return false;
    if (filters.status && ticket.status !== filters.status) return false;
    if (search && !normalize(ticket.titulo + " " + ticket.descricao).includes(search)) return false;
    return true;
  });
}

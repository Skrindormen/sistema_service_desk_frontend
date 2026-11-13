import api from "./api.js";

function unpackList(response) {
  const body = response.data || {};
  return {
    items: Array.isArray(body.data) ? body.data : [],
    pagination: body.pagination || {},
  };
}

export async function listTickets({ page = 1, limit = 10, ...filters }, signal) {
  const params = { page, limit, order: "DESC" };
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim()) {
      params[key] = value;
    }
  });
  const response = await api.get("/tickets", { params, signal });
  return unpackList(response);
}

export async function listAllTickets(filters = {}, signal, limit = 100) {
  const firstPage = await listTickets({ ...filters, page: 1, limit }, signal);
  const items = [...firstPage.items];
  const totalPages = Math.max(1, Number(firstPage.pagination.totalPages || 1));

  for (let page = 2; page <= totalPages; page += 1) {
    const result = await listTickets({ ...filters, page, limit }, signal);
    items.push(...result.items);
  }

  return items;
}

export async function getTicket(id) {
  const response = await api.get("/tickets/" + id);
  return response.data?.data ?? response.data;
}

export async function listTicketComments(id) {
  const response = await api.get("/tickets/" + id + "/comments");
  return Array.isArray(response.data?.data) ? response.data.data : [];
}

export function createTicket(payload) {
  return api.post("/tickets", payload);
}

export function updateTicket(id, payload) {
  return api.put("/tickets/" + id, payload);
}

export function cancelTicket(id, payload) {
  return api.patch("/tickets/" + id + "/cancel", payload);
}

export function addTicketComment(id, payload) {
  return api.post("/tickets/" + id + "/comments", payload);
}

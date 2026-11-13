import api from "./api";

export async function listLocals({ page = 1, limit = 100, signal } = {}) {
  const response = await api.get("/locals", { params: { page, limit }, signal });
  const body = response.data || {};
  return {
    items: Array.isArray(body.data) ? body.data : [],
    pagination: body.pagination || {},
  };
}

import api from "./api";

export async function listLocals({ page = 1, limit = 100 } = {}) {
  const response = await api.get("/locals", { params: { page, limit } });
  const body = response.data || {};
  return {
    items: Array.isArray(body.data) ? body.data : [],
    pagination: body.pagination || {},
  };
}

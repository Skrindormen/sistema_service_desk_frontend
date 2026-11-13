import api from "./api";

export async function listUsers({ page = 1, limit = 100, signal } = {}) {
  const response = await api.get("/users", { params: { page, limit, order: "ASC" }, signal });
  const body = response.data || {};
  return {
    items: Array.isArray(body.data) ? body.data : [],
    pagination: body.pagination || {},
  };
}

export async function listAllUsers({ limit = 100, signal } = {}) {
  const firstPage = await listUsers({ page: 1, limit, signal });
  const items = [...firstPage.items];
  const totalPages = Math.max(1, Number(firstPage.pagination.totalPages || 1));

  for (let page = 2; page <= totalPages; page += 1) {
    const result = await listUsers({ page, limit, signal });
    items.push(...result.items);
  }

  return items;
}

export function createUser(payload) {
  return api.post("/users", payload);
}

export function deleteUser(id) {
  return api.delete("/users/" + id);
}

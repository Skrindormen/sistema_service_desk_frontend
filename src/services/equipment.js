import api from "./api";

export async function listEquipment({ page = 1, limit = 10 } = {}) {
  const response = await api.get("/equipment", { params: { page, limit } });
  const body = response.data || {};
  return {
    items: Array.isArray(body.data) ? body.data : [],
    pagination: body.pagination || {},
  };
}

export function createEquipment(payload) {
  return api.post("/equipment", payload);
}

export function updateEquipment(id, payload) {
  return api.put("/equipment/" + id, payload);
}

export function deactivateEquipment(id) {
  return api.delete("/equipment/" + id);
}
export async function listAllEquipment({ limit = 100 } = {}) {
  const firstPage = await listEquipment({ page: 1, limit });
  const items = [...firstPage.items];
  const totalPages = Math.max(1, Number(firstPage.pagination.totalPages || 1));

  for (let page = 2; page <= totalPages; page += 1) {
    const result = await listEquipment({ page, limit });
    items.push(...result.items);
  }

  return items;
}

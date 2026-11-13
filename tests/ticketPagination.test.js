import assert from "node:assert/strict";
import test from "node:test";
import api from "../src/services/api.js";
import { listAllTickets } from "../src/services/tickets.js";

test("consulta todas as páginas e preserva os filtros no GET /tickets", async (t) => {
  const originalGet = api.get;
  const calls = [];
  api.get = async (path, config) => {
    calls.push({ path, params: config.params });
    const page = config.params.page;
    return {
      data: {
        data: [{ id: page }],
        pagination: { totalPages: 3 },
      },
    };
  };
  t.after(() => { api.get = originalGet; });

  const result = await listAllTickets({ nivel_atendimento: "N1", status: "Aberto" }, undefined, 2);

  assert.deepEqual(result.map((ticket) => ticket.id), [1, 2, 3]);
  assert.deepEqual(calls.map(({ params }) => params.page), [1, 2, 3]);
  assert.ok(calls.every(({ path, params }) => path === "/tickets" && params.nivel_atendimento === "N1" && params.status === "Aberto"));
});

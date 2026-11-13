import assert from "node:assert/strict";
import test from "node:test";
import { filterDashboardTickets, parseDashboardDate } from "../src/utils/dashboardMetrics.js";

const tickets = [
  { id: 1, titulo: "Computador não liga", descricao: "Sala 1", data_abertura: "2025-04-10T12:00:00", nivel_atendimento: "N1", id_local: 3, id_equipamento: 11, tipo: "Hardware", prioridade: "Alta", status: "Aberto" },
  { id: 2, titulo: "Acesso ao sistema", descricao: "Conta bloqueada", data_abertura: "2025-04-11T12:00:00", nivel_atendimento: "N2", id_local: 4, id_equipamento: 12, tipo: "Software", prioridade: "Média", status: "Em andamento" },
  { id: 3, titulo: "Falha no monitor", descricao: "Tela piscando", data_abertura: "2025-04-12T12:00:00", nivel_atendimento: "N1", id_local: 3, id_equipamento: 13, tipo: "Hardware", prioridade: "Baixa", status: "Fechado" },
];

test("mantém o escopo N1 mesmo com filtro de nível enviado", () => {
  const result = filterDashboardTickets(tickets, "N1", { level: "N2" });
  assert.deepEqual(result.map((ticket) => ticket.id), [1, 3]);
});

test("N2 e Admin podem filtrar nível e intervalo inclusivo", () => {
  const filters = { from: "2025-04-11", to: "2025-04-12", level: "N1" };
  assert.deepEqual(filterDashboardTickets(tickets, "N2", filters).map((ticket) => ticket.id), [3]);
  assert.deepEqual(filterDashboardTickets(tickets, "Admin", filters).map((ticket) => ticket.id), [3]);
});

test("combina laboratório, computador, tipo, prioridade, status e busca sem acento", () => {
  const result = filterDashboardTickets(tickets, "Admin", {
    localId: "3",
    equipmentId: "11",
    type: "Hardware",
    priority: "Alta",
    status: "Aberto",
    search: "nao liga",
  });
  assert.deepEqual(result.map((ticket) => ticket.id), [1]);
});

test("intervalo de datas invertido retorna lista vazia", () => {
  assert.deepEqual(filterDashboardTickets(tickets, "Admin", { from: "2025-04-12", to: "2025-04-10" }), []);
});

test("interpreta data sem horário como data local, sem deslocar o dia", () => {
  const date = parseDashboardDate("2025-04-10");
  assert.equal(date.getFullYear(), 2025);
  assert.equal(date.getMonth(), 3);
  assert.equal(date.getDate(), 10);
  assert.equal(parseDashboardDate("2025-02-31"), null);
});

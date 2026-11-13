import assert from "node:assert/strict";
import test from "node:test";
import {
  podeCancelarChamado,
  podeComentarChamado,
  podeGerenciarChamado,
} from "../src/auth/permissions.js";

const ticket = (overrides = {}) => ({
  id_solicitante: 7,
  nivel_atendimento: "N1",
  status: "Aberto",
  ...overrides,
});

test("aplica o escopo de atendimento por perfil", () => {
  assert.equal(podeGerenciarChamado("N1", ticket({ nivel_atendimento: "N1" })), true);
  assert.equal(podeGerenciarChamado("N1", ticket({ nivel_atendimento: "N2" })), false);
  assert.equal(podeGerenciarChamado("N2", ticket({ nivel_atendimento: "N1" })), true);
  assert.equal(podeGerenciarChamado("N2", ticket({ nivel_atendimento: "N2" })), true);
  assert.equal(podeGerenciarChamado("Usuario", ticket()), false);
  assert.equal(podeGerenciarChamado("Admin", ticket({ nivel_atendimento: "N3" })), true);
});

test("limita cancelamento do solicitante ao próprio chamado aberto", () => {
  assert.equal(podeCancelarChamado("Usuario", ticket(), 7), true);
  assert.equal(podeCancelarChamado("Usuario", ticket(), 8), false);
  assert.equal(podeCancelarChamado("Usuario", ticket({ status: "Em andamento" }), 7), false);
  assert.equal(podeCancelarChamado("Usuario", ticket({ status: "Fechado" }), 7), false);
  assert.equal(podeCancelarChamado("N1", ticket({ nivel_atendimento: "N2" }), 7), false);
});

test("permite comentários somente enquanto o chamado está ativo", () => {
  assert.equal(podeComentarChamado(ticket()), true);
  assert.equal(podeComentarChamado(ticket({ status: "Fechado" })), false);
  assert.equal(podeComentarChamado(ticket({ status: "Cancelado" })), false);
  assert.equal(podeComentarChamado(null), false);
});

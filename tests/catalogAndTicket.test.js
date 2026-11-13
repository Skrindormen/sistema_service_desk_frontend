import assert from "node:assert/strict";
import test from "node:test";
import { findLabLocal, frontendLabName, labNumberForLocal } from "../src/utils/labLocations.js";
import { findMachineForSelection } from "../src/utils/equipmentMatching.js";
import { createTicketPayload } from "../src/utils/newTicketPayload.js";

const locals = [
  { id: 1, nome: "Bloco A" },
  { id: 2, nome: "BLOCO B" },
  { id: 3, nome: "Bloco C" },
  { id: 4, nome: "Biblioteca" },
];

test("mapeia blocos A, B e C como laboratórios 1, 2 e 3 só na apresentação", () => {
  assert.deepEqual(locals.slice(0, 3).map(labNumberForLocal), [1, 2, 3]);
  assert.equal(labNumberForLocal(locals[3]), null);
  assert.equal(frontendLabName(locals[0]), "Laboratório 1 — Bloco A");
  assert.equal(findLabLocal(locals, "2").id, 2);
});

test("localiza computador exato no local e evita colisão entre 1 e 10", () => {
  const equipment = [
    { id: 1, id_local: 1, nome: "Laboratório 1 — Computador 10" },
    { id: 2, id_local: 1, nome: "Computador 1" },
    { id: 3, id_local: 2, nome: "Computador 1" },
    { id: 4, id_local: 1, nome: "Computador do Professor" },
  ];
  assert.equal(findMachineForSelection(equipment, 1, "1").id, 2);
  assert.equal(findMachineForSelection(equipment, 1, "10").id, 1);
  assert.equal(findMachineForSelection(equipment, 1, "professor").id, 4);
  assert.equal(findMachineForSelection(equipment, 2, "1").id, 3);
});

const fields = {
  title: "Acesso ao sistema acadêmico",
  type: "Software",
  priority: "Média",
  description: "Preciso redefinir minha senha.",
  level: "N1",
};

test("solicitação pessoal não associa local/equipamento e não envia nível de solicitante", () => {
  const result = createTicketPayload({ fields, context: "pessoal", personalCategory: "Conta ou acesso", role: "Usuario" });
  assert.deepEqual(result.payload, {
    titulo: fields.title,
    tipo: "Software",
    prioridade: "Média",
    descricao: "Contexto: pessoal — Conta ou acesso\n\nPreciso redefinir minha senha.",
  });
});

test("solicitação institucional inclui ids da API e nível de suporte", () => {
  const result = createTicketPayload({
    fields,
    context: "universidade",
    role: "N2",
    selectedLab: { id: "3" },
    selectedLabName: "Laboratório 3 — Bloco C",
    matchingMachine: { id: "44", nome: "Computador 2" },
  });
  assert.equal(result.payload.id_local, 3);
  assert.equal(result.payload.id_equipamento, 44);
  assert.equal(result.payload.nivel_atendimento, "N1");
  assert.match(result.payload.descricao, /Laboratório 3 — Bloco C, Computador 2/);
});

test("recusa hardware pessoal e solicitações institucionais sem equipamento cadastrado", () => {
  assert.match(createTicketPayload({ fields: { ...fields, type: "Hardware" }, context: "pessoal" }).error, /Hardware/);
  assert.match(createTicketPayload({ fields, context: "universidade", role: "Usuario" }).error, /laboratório/);
  assert.match(createTicketPayload({ fields, context: "universidade", role: "Usuario", selectedLab: { id: 1 } }).error, /máquina/);
});

export function createTicketPayload({
  fields,
  context,
  personalCategory,
  role,
  selectedLab,
  selectedLabName,
  matchingMachine,
}) {
  if (fields.type === "Hardware" && context !== "universidade") {
    return { error: "Para Hardware, selecione uma solicitação da universidade e indique o local do computador." };
  }
  if (!context) {
    return { error: "Selecione se a solicitação é pessoal ou da universidade." };
  }

  const payload = {
    titulo: fields.title,
    tipo: fields.type,
    prioridade: fields.priority,
    descricao: fields.description,
  };

  if (context === "pessoal") {
    payload.descricao = "Contexto: pessoal — " + personalCategory + "\n\n" + payload.descricao;
  } else {
    if (!selectedLab) {
      return { error: "Não encontrei esse laboratório na lista da API. Confira o cadastro do local." };
    }
    if (!matchingMachine) {
      return { error: "Não encontrei essa máquina vinculada ao laboratório selecionado na lista da API." };
    }
    payload.id_local = Number(selectedLab.id);
    payload.id_equipamento = Number(matchingMachine.id);
    payload.descricao = "Contexto: universidade — " + selectedLabName + ", " + matchingMachine.nome +
      "\n\n" + payload.descricao;
  }

  if (role !== "Usuario") payload.nivel_atendimento = fields.level || "N1";
  return { payload };
}

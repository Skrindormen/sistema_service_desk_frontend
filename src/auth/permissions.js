const ROLE_LABELS = {
  Usuario: "Solicitante",
  N1: "Suporte N1",
  N2: "Suporte N2",
  Admin: "Administrador",
};

const SUPPORT_ROLES = new Set(["N1", "N2", "Admin"]);

function statusEncerrado(status) {
  return ["fechado", "cancelado"].includes((status || "").toLowerCase());
}

export function nomePerfil(tipo) {
  return ROLE_LABELS[tipo] || "Usuário";
}

export function podeGerenciarChamado(tipo, chamado) {
  if (!chamado) return false;
  if (tipo === "Admin") return true;
  if (tipo === "N1") return chamado.nivel_atendimento === "N1";
  if (tipo === "N2") {
    return ["N1", "N2"].includes(chamado.nivel_atendimento);
  }
  return false;
}

export function podeCancelarChamado(tipo, chamado, usuarioId) {
  if (!chamado || statusEncerrado(chamado.status)) return false;

  if (tipo === "Usuario") {
    return (
      String(chamado.id_solicitante) === String(usuarioId) &&
      chamado.status === "Aberto"
    );
  }

  return SUPPORT_ROLES.has(tipo) && podeGerenciarChamado(tipo, chamado);
}

export function podeComentarChamado(chamado) {
  return Boolean(chamado) && !statusEncerrado(chamado.status);
}


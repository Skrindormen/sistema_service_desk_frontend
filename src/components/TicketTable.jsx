import React from "react";

function slug(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, "-");
}

export default function TicketTable({ tickets, loading, onOpen, emptyMessage }) {
  if (loading) return <p className="empty-state">Carregando chamados...</p>;
  if (!tickets.length) return <p className="empty-state">{emptyMessage}</p>;

  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr><th>Chamado</th><th>Tipo</th><th>Nível</th><th>Prioridade</th><th>Status</th><th aria-label="Ações"></th></tr>
        </thead>
        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td><div className="ticket-title-cell"><strong>#{ticket.id} · {ticket.titulo}</strong><small>{ticket.descricao}</small></div></td>
              <td>{ticket.tipo}</td>
              <td>{ticket.nivel_atendimento || "—"}</td>
              <td><span className={"badge priority-" + slug(ticket.prioridade)}>{ticket.prioridade}</span></td>
              <td><span className={"badge status-" + slug(ticket.status)}>{ticket.status}</span></td>
              <td><button className="button button-muted button-small" type="button" onClick={() => onOpen(ticket)}>Ver chamado</button></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

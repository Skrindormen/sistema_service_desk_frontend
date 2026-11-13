import React from "react";
import TicketTable from "./TicketTable";
import PaginationControls from "./PaginationControls";

export default function TicketsPage({
  role, tickets, loading, titleSearch, status, priority, pagination,
  onTitleSearch, onStatus, onPriority, onPage, onOpen,
}) {
  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">{role === "Usuario" ? "SOLICITANTE" : "ATENDIMENTO"}</p>
          <h1>{role === "Usuario" ? "Minhas solicitações" : <>Fila de <span>chamados</span></>}</h1>
          <p>Filtros e resultados são consultados na API conforme o escopo do seu perfil.</p>
        </div>
      </section>

      <section className="panel ticket-panel">
        <div className="filter-bar">
          <label className="filter-field filter-search">
            <span>Buscar título</span>
            <input
              type="search"
              value={titleSearch}
              onChange={(event) => onTitleSearch(event.target.value)}
              placeholder="Digite parte do título"
            />
          </label>
          <label className="filter-field">
            <span>Status</span>
            <select value={status} onChange={(event) => onStatus(event.target.value)}>
              <option value="">Todos</option>
              <option value="Aberto">Aberto</option>
              <option value="Em andamento">Em andamento</option>
              <option value="Fechado">Fechado</option>
              <option value="Cancelado">Cancelado</option>
            </select>
          </label>
          <label className="filter-field">
            <span>Prioridade</span>
            <select value={priority} onChange={(event) => onPriority(event.target.value)}>
              <option value="">Todas</option>
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </label>
          <span className="filter-count">{loading ? "…" : pagination.total + " resultados"}</span>
        </div>
        <TicketTable
          tickets={tickets}
          loading={loading}
          onOpen={onOpen}
          emptyMessage="Nenhum chamado corresponde aos filtros selecionados."
        />
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          onChange={onPage}
        />
      </section>
    </>
  );
}

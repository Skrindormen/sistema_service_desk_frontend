import TicketTable from "./TicketTable";

export default function OverviewPage({
  name, role, tickets, pagination, loading, onOpen, onShowAll, requesterNames,
}) {
  const inProgress = tickets.filter((ticket) => ticket.status === "Em andamento").length;
  const open = tickets.filter((ticket) => ticket.status === "Aberto").length;

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">CENTRAL DE SUPORTE</p>
          <h1>Olá, <span>{name.split(" ")[0]}</span></h1>
          <p>{role === "Usuario"
            ? "Acompanhe suas solicitações e abra um chamado quando precisar."
            : "Acompanhe os chamados disponibilizados para o seu perfil."}</p>
        </div>
      </section>

      <section className="stats-grid" aria-label="Resumo de chamados">
        <article className="stat-card">
          <div className="stat-icon">≡</div>
          <div className="stat-label">{role === "Usuario" ? "Seus chamados" : "Chamados visíveis"}</div>
          <strong>{loading ? "—" : pagination.total}</strong>
          <small>Resultados com os filtros atuais</small>
        </article>
        <article className="stat-card">
          <div className="stat-icon stat-icon-red">◷</div>
          <div className="stat-label">Em andamento</div>
          <strong>{loading ? "—" : inProgress}</strong>
          <small>Na página atual</small>
        </article>
        <article className="stat-card">
          <div className="stat-icon stat-icon-dark">✓</div>
          <div className="stat-label">Aguardando atendimento</div>
          <strong>{loading ? "—" : open}</strong>
          <small>Na página atual</small>
        </article>
      </section>

      <section className="panel table-panel">
        <div className="panel-heading">
          <div><p className="eyebrow">ATUALIZAÇÕES</p><h2>Chamados recentes</h2></div>
          <button className="text-button" type="button" onClick={onShowAll}>Ver todos</button>
        </div>
        <TicketTable
          tickets={tickets}
          loading={loading}
          onOpen={onOpen}
          requesterNames={requesterNames}
          emptyMessage="Nenhum chamado disponível para este perfil."
        />
      </section>
    </>
  );
}

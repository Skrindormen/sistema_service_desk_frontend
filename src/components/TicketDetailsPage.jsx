import React from "react";
import {
  nomePerfil,
  podeCancelarChamado,
  podeComentarChamado,
  podeGerenciarChamado,
} from "../auth/permissions";

function slug(value) {
  return (value || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\s+/g, "-");
}

export default function TicketDetailsPage({
  ticket, role, userId, comments, loading, loadingComments, submitting,
  onBack, onUpdate, onComment, onCancel,
}) {
  if (!ticket) return null;
  const canManage = podeGerenciarChamado(role, ticket) &&
    !["Fechado", "Cancelado"].includes(ticket.status);
  const canCancel = podeCancelarChamado(role, ticket, userId);
  const canComment = podeComentarChamado(ticket);

  return (
    <>
      <div className="form-page-heading detail-heading">
        <div>
          <p className="eyebrow">CHAMADO #{ticket.id}</p>
          <h1>{ticket.titulo}</h1>
          <p>Aberto em {ticket.data_abertura ? new Date(ticket.data_abertura).toLocaleString("pt-BR") : "—"}</p>
        </div>
        <button className="button button-return" type="button" onClick={onBack}>Voltar à lista de chamados</button>
      </div>

      {loading ? <section className="panel detail-loading">Carregando detalhes do chamado...</section> : (
        <div className="detail-layout">
          <div className="detail-main">
            <section className="panel detail-card">
              <div className="panel-heading">
                <div><p className="eyebrow">SOLICITAÇÃO</p><h2>Descrição</h2></div>
                <span className={"badge status-" + slug(ticket.status)}>{ticket.status}</span>
              </div>
              <p className="ticket-description">{ticket.descricao}</p>
              <div className="ticket-meta-grid">
                <div><span>Tipo</span><strong>{ticket.tipo}</strong></div>
                <div><span>Prioridade</span><strong>{ticket.prioridade}</strong></div>
                <div><span>Nível de atendimento</span><strong>{ticket.nivel_atendimento || "—"}</strong></div>
                <div><span>Solicitante</span><strong>#{ticket.id_solicitante}</strong></div>
                <div><span>Local</span><strong>{ticket.id_local ? "Local #" + ticket.id_local : "—"}</strong></div>
                <div><span>Equipamento</span><strong>{ticket.id_equipamento ? "Equipamento #" + ticket.id_equipamento : "—"}</strong></div>
              </div>
            </section>

            {canManage && (
              <section className="panel detail-card">
                <div className="panel-heading">
                  <div><p className="eyebrow">SUPORTE</p><h2>Atendimento técnico</h2></div>
                  <span className="permission-note">{nomePerfil(role)}</span>
                </div>
                <form className="form-stack" onSubmit={onUpdate}>
                  <div className="form-grid">
                    <label className="field"><span>Status</span><select name="status" defaultValue={ticket.status}><option value="Aberto">Aberto</option><option value="Em andamento">Em andamento</option><option value="Fechado">Fechado</option></select></label>
                    <label className="field"><span>Prioridade</span><select name="prioridade" defaultValue={ticket.prioridade}><option value="Baixa">Baixa</option><option value="Média">Média</option><option value="Alta">Alta</option><option value="Crítica">Crítica</option></select></label>
                  </div>
                  <div className="form-grid">
                    <label className="field"><span>Nível de atendimento</span><select name="nivel_atendimento" defaultValue={ticket.nivel_atendimento || "N1"}><option value="N1">N1</option><option value="N2">N2</option></select></label>
                    <label className="field"><span>ID do técnico responsável</span><input name="id_tecnico_atribuido" type="number" min="1" defaultValue={ticket.id_tecnico_atribuido || ""} placeholder="Opcional" /></label>
                  </div>
                  <p className="field-help">Registre diagnóstico e solução nos comentários do chamado.</p>
                  <div className="form-actions"><button className="button button-primary" type="submit" disabled={submitting}>{submitting ? "Salvando..." : "Salvar atendimento"}</button></div>
                </form>
              </section>
            )}

            {canCancel && (
              <section className="panel detail-card cancel-card">
                <div className="panel-heading"><div><p className="eyebrow">CANCELAMENTO</p><h2>Cancelar chamado</h2></div></div>
                <form className="form-stack" onSubmit={onCancel}>
                  <label className="field"><span>Justificativa</span><textarea name="justificativa" rows="3" maxLength="1000" required placeholder="Informe o motivo do cancelamento." /></label>
                  <div className="form-actions"><button className="button button-danger" type="submit" disabled={submitting}>Cancelar chamado</button></div>
                </form>
              </section>
            )}

            <section className="panel detail-card">
              <div className="panel-heading"><div><p className="eyebrow">HISTÓRICO</p><h2>Comentários</h2></div><span className="comment-count">{comments.length}</span></div>
              {loadingComments ? <p className="empty-state">Carregando comentários...</p> : comments.length ? (
                <div className="comment-list">
                  {comments.map((comment) => (
                    <article className="comment-item" key={comment.id}>
                      <div className="comment-avatar">#{comment.id_usuario}</div>
                      <div>
                        <div className="comment-meta"><strong>Usuário #{comment.id_usuario}</strong><time dateTime={comment.created_at}>{comment.created_at ? new Date(comment.created_at).toLocaleString("pt-BR") : ""}</time></div>
                        <p>{comment.comentario}</p>
                      </div>
                    </article>
                  ))}
                </div>
              ) : <p className="empty-state">Ainda não há comentários neste chamado.</p>}
              {canComment && (
                <form className="comment-form" onSubmit={onComment}>
                  <label className="field"><span>Adicionar comentário público</span><textarea name="comentario" rows="3" maxLength="2000" required placeholder="Escreva uma atualização ou descreva a solução aplicada." /></label>
                  <button className="button button-primary" type="submit" disabled={submitting}>{submitting ? "Enviando..." : "Comentar"}</button>
                </form>
              )}
            </section>
          </div>

          <aside className="detail-side">
            <section className="panel detail-card"><p className="eyebrow">ACESSO</p><h2>Seu perfil</h2><p className="side-copy">{nomePerfil(role)}</p><p className="field-help">As ações disponíveis refletem o escopo do perfil e o nível deste chamado.</p></section>
            {ticket.data_fechamento && <section className="panel detail-card"><p className="eyebrow">ENCERRAMENTO</p><h2>Fechado em</h2><p className="side-copy">{new Date(ticket.data_fechamento).toLocaleString("pt-BR")}</p></section>}
          </aside>
        </div>
      )}
    </>
  );
}

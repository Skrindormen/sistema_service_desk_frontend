import React from "react";
import PaginationControls from "./PaginationControls";

export default function EquipmentPage({
  equipment, locals, loading, pagination, editingId, form, submitting,
  onRefresh, onEdit, onCancelEdit, onFormChange, onSave, onDeactivate, onPage,
}) {
  return (
    <>
      <section className="welcome-row">
        <div><p className="eyebrow">ADMINISTRAÇÃO</p><h1>Inventário de <span>equipamentos</span></h1><p>Cadastro, edição e desativação de ativos da universidade.</p></div>
      </section>

      <section className="panel detail-card equipment-form-card">
        <div className="panel-heading"><div><p className="eyebrow">{editingId ? "EDIÇÃO" : "NOVO ATIVO"}</p><h2>{editingId ? "Editar equipamento" : "Cadastrar equipamento"}</h2></div></div>
        <form className="equipment-form" onSubmit={onSave}>
          <label className="field"><span>Nome</span><input name="nome" value={form.nome} onChange={onFormChange} maxLength="100" required /></label>
          <label className="field"><span>Descrição</span><input name="descricao" value={form.descricao} onChange={onFormChange} maxLength="255" /></label>
          <label className="field"><span>Local</span><select name="id_local" value={form.id_local} onChange={onFormChange} required><option value="">Selecione um local</option>{locals.map((local) => <option key={local.id} value={local.id}>{local.nome}</option>)}</select></label>
          <div className="equipment-form-actions">
            {editingId && <button className="button button-muted" type="button" onClick={onCancelEdit}>Descartar</button>}
            <button className="button button-primary" type="submit" disabled={submitting}>{submitting ? "Salvando..." : editingId ? "Salvar edição" : "Cadastrar"}</button>
          </div>
        </form>
      </section>

      <section className="panel table-panel equipment-table-panel">
        <div className="panel-heading"><div><p className="eyebrow">ATIVOS</p><h2>Equipamentos cadastrados</h2></div><button className="text-button" type="button" onClick={onRefresh}>Atualizar lista</button></div>
        {loading ? <p className="empty-state">Carregando inventário...</p> : equipment.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>Descrição</th><th>Local</th><th></th></tr></thead>
              <tbody>{equipment.map((item) => (
                <tr key={item.id}>
                  <td><strong>{item.nome}</strong></td>
                  <td>{item.descricao || "—"}</td>
                  <td>{locals.find((local) => String(local.id) === String(item.id_local))?.nome || "Local #" + item.id_local}</td>
                  <td className="table-actions"><button className="button button-muted button-small" type="button" onClick={() => onEdit(item)}>Editar</button><button className="button button-danger button-small" type="button" onClick={() => onDeactivate(item)} disabled={submitting}>Desativar</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="empty-state">Nenhum equipamento cadastrado nesta página.</p>}
        <PaginationControls itemLabel="equipamentos" page={pagination.page} totalPages={pagination.totalPages} total={pagination.total} onChange={onPage} />
      </section>
    </>
  );
}

import { useMemo, useState } from "react";
import { nomePerfil } from "../auth/permissions";

function normalize(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function UserManagementPage({ users, loading, busy, error, onRefresh, onCreate, onDelete }) {
  const [search, setSearch] = useState("");
  const filteredUsers = useMemo(() => {
    const query = normalize(search.trim());
    if (!query) return users;
    return users.filter((user) =>
      [user.nome, user.email, user.tipo].some((value) => normalize(value).includes(query)),
    );
  }, [search, users]);

  return (
    <>
      <section className="welcome-row">
        <div>
          <p className="eyebrow">ADMINISTRAÇÃO</p>
          <h1>Gestão de <span>usuários</span></h1>
          <p>Cadastre contas e gerencie os acessos ao Service Desk.</p>
        </div>
      </section>

      <section className="panel detail-card user-form-card">
        <div className="panel-heading">
          <div><p className="eyebrow">NOVA CONTA</p><h2>Cadastrar usuário</h2></div>
        </div>
        <form className="user-create-form" onSubmit={onCreate}>
          <label className="field"><span>Nome completo</span><input name="nome" maxLength="100" autoComplete="name" required disabled={busy} /></label>
          <label className="field"><span>E-mail</span><input name="email" type="email" maxLength="150" autoComplete="email" required disabled={busy} /></label>
          <label className="field"><span>Senha inicial</span><input name="senha" type="password" minLength="8" autoComplete="new-password" required disabled={busy} /></label>
          <label className="field">
            <span>Perfil</span>
            <select name="tipo" defaultValue="Usuario" required disabled={busy}>
              <option value="Usuario">Solicitante</option>
              <option value="N1">Suporte N1</option>
              <option value="N2">Suporte N2</option>
              <option value="Admin">Administrador</option>
            </select>
          </label>
          <div className="user-form-actions">
            <button className="button button-primary" type="submit" disabled={busy}>{busy ? "Salvando..." : "Cadastrar usuário"}</button>
          </div>
        </form>
      </section>

      <section className="panel table-panel user-table-panel">
        <div className="panel-heading user-table-heading">
          <div><p className="eyebrow">CONTAS</p><h2>Usuários cadastrados</h2></div>
          <button className="text-button" type="button" onClick={onRefresh} disabled={busy}>Atualizar lista</button>
        </div>
        <label className="filter-field user-search">
          <span>Buscar usuário</span>
          <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Nome, e-mail ou perfil" />
        </label>
        {error && <div className="notice notice-error" role="alert">{error}</div>}
        {loading ? <p className="empty-state">Carregando usuários...</p> : filteredUsers.length ? (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Status</th><th aria-label="Ações"></th></tr></thead>
              <tbody>{filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td><strong>{user.nome}</strong></td>
                  <td>{user.email}</td>
                  <td>{nomePerfil(user.tipo)}</td>
                  <td><span className={"user-status " + (user.ativo ? "user-status-active" : "user-status-inactive")}>{user.ativo ? "Ativo" : "Inativo"}</span></td>
                  <td className="table-actions"><button className="button button-danger button-small" type="button" onClick={() => onDelete(user)} disabled={busy}>Excluir</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        ) : <p className="empty-state">Nenhum usuário corresponde à busca.</p>}
      </section>
    </>
  );
}

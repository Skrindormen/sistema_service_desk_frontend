export default function PaginationControls({
  page,
  totalPages,
  total,
  itemLabel = "chamados",
  onChange,
}) {
  const pages = Math.max(1, Number(totalPages) || 1);
  return (
    <nav className="pagination" aria-label="Paginação">
      <button
        className="button button-muted button-small"
        type="button"
        onClick={() => onChange(Math.max(1, page - 1))}
        disabled={page <= 1}
      >
        Anterior
      </button>
      <span>Página {page} de {pages} · {total} {itemLabel}</span>
      <button
        className="button button-muted button-small"
        type="button"
        onClick={() => onChange(Math.min(pages, page + 1))}
        disabled={page >= pages}
      >
        Próxima
      </button>
    </nav>
  );
}

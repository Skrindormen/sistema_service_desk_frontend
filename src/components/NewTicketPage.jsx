import { useMemo, useState } from "react";
import {
  findLabLocal, frontendLabName, labOptionName, LAB_NUMBERS,
} from "../utils/labLocations";
import { createTicketPayload } from "../utils/newTicketPayload";
import { findMachineForSelection } from "../utils/equipmentMatching";

const MACHINE_OPTIONS = [
  { value: "professor", label: "Computador do professor" },
  ...Array.from({ length: 30 }, (_, index) => ({
    value: String(index + 1),
    label: "Computador " + (index + 1),
  })),
];

export default function NewTicketPage({
  role, locals, equipment, catalogLoading, catalogError, submitting,
  onNeedCatalog, onSubmit, onCancel,
}) {
  const [context, setContext] = useState("");
  const [personalCategory, setPersonalCategory] = useState("Conta ou acesso");
  const [ticketType, setTicketType] = useState("Software");
  const [lab, setLab] = useState("");
  const [machine, setMachine] = useState("");
  const [formError, setFormError] = useState("");

  const selectedLab = useMemo(() => findLabLocal(locals, lab), [locals, lab]);
  const matchingMachine = useMemo(
    () => findMachineForSelection(equipment, selectedLab?.id, machine),
    [equipment, selectedLab, machine],
  );

  function changeContext(value) {
    setContext(value);
    if (value !== "universidade") setTicketType("Software");
    setLab("");
    setMachine("");
    setFormError("");
    if (value === "universidade") onNeedCatalog();
  }

  function submit(event) {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const result = createTicketPayload({
      fields: {
        title: formData.get("titulo"),
        type: formData.get("tipo"),
        priority: formData.get("prioridade"),
        description: formData.get("descricao"),
        level: formData.get("nivel_atendimento"),
      },
      context,
      personalCategory,
      role,
      selectedLab,
      selectedLabName: selectedLab ? frontendLabName(selectedLab) : "",
      matchingMachine,
    });
    if (result.error) {
      setFormError(result.error);
      return;
    }
    onSubmit(result.payload);
  }

  return (
    <section className="form-page">
      <div className="form-page-heading">
        <div><p className="eyebrow">NOVA SOLICITAÇÃO</p><h1>Abrir chamado</h1><p>O solicitante será identificado pela sessão.</p></div>
        <button className="button button-return" type="button" onClick={onCancel}>Voltar aos chamados</button>
      </div>

      {catalogError && <div className="notice notice-error" role="alert">{catalogError}</div>}
      {formError && <div className="notice notice-error" role="alert">{formError}</div>}

      <form className="panel form-card form-stack" onSubmit={submit}>
        <label className="field">
          <span>Escopo da solicitação</span>
          <select value={context} onChange={(event) => changeContext(event.target.value)} required>
            <option value="">Selecione uma opção</option>
            <option value="pessoal">Solicitação individual (conta ou acesso)</option>
            <option value="universidade">Recurso institucional (laboratório ou equipamento)</option>
          </select>
        </label>

        {context === "pessoal" && (
          <label className="field">
            <span>Categoria da solicitação</span>
            <select value={personalCategory} onChange={(event) => setPersonalCategory(event.target.value)}>
              <option value="Conta ou acesso">Conta ou acesso</option>
              <option value="Outra solicitação individual">Outra solicitação individual</option>
            </select>
          </label>
        )}

        <label className="field">
          <span>Título</span>
          <input name="titulo" maxLength="150" placeholder="Ex.: Acesso ao sistema acadêmico" required />
        </label>
        <label className="field">
          <span>Descrição</span>
          <textarea name="descricao" rows="5" placeholder="Descreva o problema ou a solicitação." required />
        </label>

        <div className="form-grid">
          <label className="field">
            <span>Tipo</span>
            <select name="tipo" value={ticketType} onChange={(event) => setTicketType(event.target.value)} required>
              <option value="Hardware" disabled={context !== "universidade"}>Hardware</option>
              <option value="Software">Software</option>
            </select>
            <small className="field-help">“Outros” ficará disponível quando o contrato da API aceitar esse tipo.</small>
          </label>
          <label className="field">
            <span>Prioridade</span>
            <select name="prioridade" defaultValue="Média" required>
              <option value="Baixa">Baixa</option>
              <option value="Média">Média</option>
              <option value="Alta">Alta</option>
              <option value="Crítica">Crítica</option>
            </select>
          </label>
        </div>

        {context === "universidade" && (
          <div className="form-grid">
            <label className="field">
              <span>Laboratório</span>
              <select
                value={lab}
                onChange={(event) => { setLab(event.target.value); setMachine(""); setFormError(""); }}
                required
                disabled={catalogLoading || !locals.length}
              >
                <option value="">{catalogLoading ? "Carregando locais..." : "Selecione o laboratório"}</option>
                {LAB_NUMBERS.map((number) => (
                  <option key={number} value={number}>{labOptionName(locals, number)}</option>
                ))}
              </select>
              {lab && !selectedLab && !catalogLoading && (
                <small className="field-error">{labOptionName(locals, lab)} não foi encontrado nos locais cadastrados na API.</small>
              )}
            </label>
            <label className="field">
              <span>Máquina</span>
              <select
                value={machine}
                onChange={(event) => { setMachine(event.target.value); setFormError(""); }}
                required
                disabled={!selectedLab || catalogLoading}
              >
                <option value="">Selecione o computador</option>
                {MACHINE_OPTIONS.map((option) => {
                  const found = findMachineForSelection(equipment, selectedLab?.id, option.value);
                  return (
                    <option key={option.value} value={option.value} disabled={!found}>
                      {option.label}{found ? "" : " — sem cadastro neste laboratório"}
                    </option>
                  );
                })}
              </select>
              {machine && !matchingMachine && !catalogLoading && (
                <small className="field-error">O computador escolhido não está vinculado ao laboratório na API.</small>
              )}
            </label>
          </div>
        )}

        {catalogLoading && <p className="field-help">Carregando locais e equipamentos cadastrados...</p>}

        {role !== "Usuario" && (
          <label className="field">
            <span>Nível inicial de atendimento</span>
            <select name="nivel_atendimento" defaultValue="N1"><option value="N1">N1</option><option value="N2">N2</option></select>
            <small className="field-help">Disponível para perfis de suporte e administração.</small>
          </label>
        )}

        <div className="form-actions">
          <button className="button button-muted" type="button" onClick={onCancel}>Cancelar</button>
          <button className="button button-primary" type="submit" disabled={submitting || catalogLoading}>
            {submitting ? "Enviando..." : "Enviar chamado"}
          </button>
        </div>
      </form>
    </section>
  );
}

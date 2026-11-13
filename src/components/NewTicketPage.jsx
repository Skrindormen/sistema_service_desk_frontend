import React, { useMemo, useState } from "react";

function normalize(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function findLab(locals, labNumber) {
  const expected = Number(labNumber);
  return locals.find((local) => {
    const name = normalize(local.nome);
    const numbers = name.match(/\d+/g) || [];
    return (name.includes("lab") || name.includes("laboratorio")) &&
      numbers.some((number) => Number(number) === expected);
  });
}

function findMachine(equipment, localId, machine) {
  return equipment.find((item) => {
    if (String(item.id_local) !== String(localId)) return false;
    const name = normalize(item.nome);
    if (machine === "professor") return name.includes("professor") || name.includes("docente");
    const numbers = name.match(/\d+/g) || [];
    const machineName = name.includes("maquina") || name.includes("computador") ||
      name.includes("estacao") || name.includes("pc");
    return machineName && numbers.some((number) => Number(number) === Number(machine));
  });
}

const MACHINE_OPTIONS = [
  { value: "professor", label: "Máquina do professor" },
  ...Array.from({ length: 30 }, (_, index) => ({
    value: String(index + 1),
    label: "Máquina " + (index + 1),
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

  const selectedLab = useMemo(() => findLab(locals, lab), [locals, lab]);
  const matchingMachine = useMemo(
    () => findMachine(equipment, selectedLab?.id, machine),
    [equipment, selectedLab, machine],
  );

  function changeContext(value) {
    setContext(value);
    if (value === "pessoal") setTicketType("Software");
    setLab("");
    setMachine("");
    setFormError("");
    if (value === "universidade") onNeedCatalog();
  }

  function submit(event) {
    event.preventDefault();
    setFormError("");

    const formData = new FormData(event.currentTarget);
    const type = formData.get("tipo");
    if (type === "Hardware" && context !== "universidade") {
      setFormError("Para Hardware, selecione uma solicitação da universidade e indique o local do ativo.");
      return;
    }
    if (!context) {
      setFormError("Selecione se a solicitação é pessoal ou da universidade.");
      return;
    }

    const payload = {
      titulo: formData.get("titulo"),
      tipo: type,
      prioridade: formData.get("prioridade"),
      descricao: formData.get("descricao"),
    };

    if (context === "pessoal") {
      payload.descricao =
        "Contexto: pessoal — " + personalCategory + "\n\n" + payload.descricao;
    } else {
      if (!selectedLab) {
        setFormError("Não encontrei esse laboratório na lista da API. Confira o cadastro do local.");
        return;
      }
      if (!matchingMachine) {
        setFormError("Não encontrei essa máquina vinculada ao laboratório selecionado na lista da API.");
        return;
      }
      payload.id_local = Number(selectedLab.id);
      payload.id_equipamento = Number(matchingMachine.id);
      payload.descricao =
        "Contexto: universidade — Lab " + lab + ", " + matchingMachine.nome +
        "\n\n" + payload.descricao;
    }

    if (role !== "Usuario") payload.nivel_atendimento = formData.get("nivel_atendimento") || "N1";
    onSubmit(payload);
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
              <option>Conta e acessos</option>
              <option>Outra solicitação individual</option>
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
                {[1, 2, 3, 4, 5].map((number) => (
                  <option key={number} value={number}>Lab {number}</option>
                ))}
              </select>
              {lab && !selectedLab && !catalogLoading && (
                <small className="field-error">Lab {lab} não foi encontrado nos locais cadastrados na API.</small>
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
                <option value="">Selecione a máquina</option>
                {MACHINE_OPTIONS.map((option) => {
                  const found = findMachine(equipment, selectedLab?.id, option.value);
                  return (
                    <option key={option.value} value={option.value} disabled={!found}>
                      {option.label}{found ? "" : " — sem cadastro para este laboratório"}
                    </option>
                  );
                })}
              </select>
              {machine && !matchingMachine && !catalogLoading && (
                <small className="field-error">A máquina escolhida não está vinculada ao laboratório na API.</small>
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

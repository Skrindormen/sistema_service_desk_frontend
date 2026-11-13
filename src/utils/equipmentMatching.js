function normalize(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function findMachineForSelection(equipment, localId, machine) {
  if (!localId || !machine) return undefined;

  return equipment.find((item) => {
    if (String(item.id_local) !== String(localId)) return false;
    const name = normalize(item.nome);

    if (machine === "professor") {
      return name.includes("professor") || name.includes("docente");
    }

    const number = Number(machine);
    if (!Number.isInteger(number) || number < 1) return false;
    const namedMachine = name.match(/\b(?:maquina|computador|estacao|desktop|pc)\s*(?:n(?:umero)?\s*)?[#º°-]?\s*(\d+)\b/);
    if (namedMachine) return Number(namedMachine[1]) === number;

    // Catálogos antigos podem usar nomes como "Equipamento #12" sem o tipo.
    const numbers = name.match(/\d+/g) || [];
    return numbers.length > 0 && Number(numbers[numbers.length - 1]) === number;
  });
}

function normalize(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function findLab(locals, labNumber) {
  return locals.find((local) => {
    const name = normalize(local.nome);
    const numbers = name.match(/\d+/g) || [];
    return (name.includes("lab") || name.includes("laboratorio")) &&
      numbers.some((number) => Number(number) === labNumber);
  });
}

function alreadyRegistered(equipment, localId, machine) {
  return equipment.some((item) => {
    if (String(item.id_local) !== String(localId)) return false;
    const name = normalize(item.nome);
    if (machine.value === "professor") {
      return name.includes("professor") || name.includes("docente");
    }

    const number = machine.value;
    const matcher = new RegExp(
      "(?:maquina|computador|estacao|\\bpc\\b)\\s*(?:n\\.?\\s*)?0?" +
        number +
        "\\b",
    );
    return matcher.test(name);
  });
}

export function buildStandardEquipmentPlan(locals, equipment) {
  const missingLabs = [];
  const missingEquipment = [];
  let labsFound = 0;

  for (let labNumber = 1; labNumber <= 5; labNumber += 1) {
    const local = findLab(locals, labNumber);
    if (!local) {
      missingLabs.push("Lab " + labNumber);
      continue;
    }

    labsFound += 1;
    const machines = [
      {
        value: "professor",
        label: "Máquina do professor",
        name: "Lab " + labNumber + " - Máquina do professor",
        description: "Estação de trabalho do professor — Lab " + labNumber + ".",
      },
      ...Array.from({ length: 30 }, (_, index) => {
        const number = index + 1;
        return {
          value: String(number),
          label: "Máquina " + number,
          name: "Lab " + labNumber + " - Máquina " + number,
          description: "Estação de trabalho " + number + " — Lab " + labNumber + ".",
        };
      }),
    ];

    for (const machine of machines) {
      if (!alreadyRegistered(equipment, local.id, machine)) {
        missingEquipment.push({
          nome: machine.name,
          descricao: machine.description,
          id_local: Number(local.id),
          localNome: local.nome,
          machineLabel: machine.label,
        });
      }
    }
  }

  return {
    labsFound,
    expectedCount: labsFound * 31,
    existingCount: labsFound * 31 - missingEquipment.length,
    missingLabs,
    missingEquipment,
  };
}

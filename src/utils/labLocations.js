function normalize(value) {
  return (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

const BLOCK_LABS = { a: 1, b: 2, c: 3 };

export const LAB_NUMBERS = [1, 2, 3];

export function labNumberForLocal(local) {
  const name = normalize(local?.nome);
  const block = name.match(/\bbloco\s+([abc])\b/);
  if (block) return BLOCK_LABS[block[1]];

  if (!name.includes("lab") && !name.includes("laboratorio")) return null;
  const numbers = name.match(/\d+/g) || [];
  const validNumber = numbers.map(Number).find((number) => LAB_NUMBERS.includes(number));
  return validNumber || null;
}

export function findLabLocal(locals, labNumber) {
  const expected = Number(labNumber);
  return locals.find((local) => labNumberForLocal(local) === expected);
}

export function frontendLabName(local) {
  const number = labNumberForLocal(local);
  if (!number) return local?.nome || "";

  const block = (local.nome || "").match(/bloco\s+([abc])/i);
  return block
    ? "Laboratório " + number + " — Bloco " + block[1].toUpperCase()
    : "Laboratório " + number;
}

export function labOptionName(locals, labNumber) {
  const local = findLabLocal(locals, labNumber);
  return local ? frontendLabName(local) : "Laboratório " + labNumber;
}

const TERMOS_BLOQUEADOS = new Set([
  "macaco", "macaca", "macacos", "macacas",
  "crioulo", "crioula", "crioulinho", "crioulinha",
  "viado", "viada", "viadinho", "viadinha",
  "bicha", "bichinha", "bichinhao",
  "sapatao", "sapatona", "sapatinho",
  "traveco", "traveca", "travecao",
  "retardado", "retardada", "retardados", "retardadas", "mongoloide", "mongoloides",
  "aleijado", "aleijada", "aleijados", "aleijadas",
  "vadia", "vadias", "vagabunda", "vagabundo", "vagabundas", "vagabundos",
]);

export function temLinguagemPreconceituosa(texto: string) {
  const normalizado = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[4@]/g, "a")
    .replace(/[3]/g, "e")
    .replace(/[1!|]/g, "i")
    .replace(/[0]/g, "o")
    .replace(/[5$]/g, "s")
    .replace(/[7]/g, "t")
    .replace(/[8]/g, "b");
  const palavras = normalizado.match(/[a-z0-9]+/g) ?? [];
  return palavras.some((palavra) => TERMOS_BLOQUEADOS.has(palavra));
}

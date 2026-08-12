// Mapa inicial de bairros de Ribeirão Preto → zona de entrega.
// Ajuste as listas conforme a realidade das rotas do Valdir.
export const RP_ZONES: Record<string, string[]> = {
  "Centro": ["Centro", "Cidade Alta", "Vila Seixas", "Jardim Mosteiro", "Boulevard", "Campos Elíseos", "Vila Amélia"],
  "Zona Norte": ["Ipiranga", "Vila Mariana", "Quintino Facci", "Parque Ribeirão Preto", "Adão do Carmo", "Heitor Rigoni", "Vila Elisa", "Jardim Paiva", "Alexandre Balbo", "Tanquinho"],
  "Zona Sul": ["Vila Tibério", "Jardim Irajá", "Jardim Zara", "Alto da Boa Vista", "City Ribeirão", "Jardim Botânico", "Jardim América", "Nova Ribeirânia"],
  "Zona Leste": ["Ribeirânia", "Jardim Recreio", "Santa Ângela", "Parque dos Flamboyans", "Jardim Primavera", "Jardim São Luiz", "Vila São Francisco"],
  "Zona Oeste": ["Vila Virgínia", "Jardim Antártica", "Jardim Paulista", "Santa Cruz do José Jacques", "Jardim Aeroporto", "Presidente Dutra", "Jardim Marchesi"]
};

export const RP_REGIONS = ["Zona Norte", "Centro", "Zona Sul", "Zona Leste", "Zona Oeste"];

export const ALL_RP_DISTRICTS = Object.values(RP_ZONES).flat().sort((a, b) => a.localeCompare(b));

export function zoneForDistrict(d: string): string | null {
  const norm = (d || "").trim().toLowerCase();
  if (!norm) return null;
  for (const [zone, list] of Object.entries(RP_ZONES)) {
    if (list.some(b => b.toLowerCase() === norm)) return zone;
  }
  for (const [zone, list] of Object.entries(RP_ZONES)) {
    if (list.some(b => {
      const lb = b.toLowerCase();
      return lb.includes(norm) || norm.includes(lb);
    })) return zone;
  }
  return null;
}
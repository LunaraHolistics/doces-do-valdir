import { supabase } from "./supabase";

export const money = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export const moneyFromCents = (c: number) => money(c / 100);

export const CATNAMES: Record<number, string> = {
  1: "Doces", 2: "Balas", 3: "Outros", 4: "Utilidades"
};

export const STATUS_SEQ = [
  "NOVO",
  "CONFIRMADO",
  "AGUARDANDO PAGAMENTO",
  "SEPARANDO",
  "PRONTO PARA ROTA",
  "CONCLUÍDO"
];

export const ALL_STATUSES = [...STATUS_SEQ, "PENDENTE DE ENTREGA"];

export const REASONS = [
  "Não estava em casa",
  "Endereço errado",
  "Cliente pediu reagendamento",
  "Outro"
];

export const orderTotal = (o: any) => (o.total_cents != null ? o.total_cents / 100 : (o.total || 0));
export const orderEntry = (o: any) => (o.entry_cents != null ? o.entry_cents / 100 : orderTotal(o) / 2);
export const orderBalance = (o: any) => (o.balance_cents != null ? o.balance_cents / 100 : orderTotal(o) - orderEntry(o));
export const orderLabel = (o: any) => o.number || o.id;
export const orderName = (o: any) => o.customer_name || "Cliente";
export const statusIdx = (s: string) => STATUS_SEQ.indexOf(s);

export const payLabel = (o: any) => {
  const m = o.payment_method === "CARTAO" ? "Cartão" : o.payment_method === "PIX" ? "PIX" : "Dinheiro";
  if (o.payment_method === "DINHEIRO") return "Dinheiro";
  return o.payment_confirmed ? `${m} · pago/confirmado` : `${m} · aguardando`;
};

export const dateBR = (iso?: string | null) =>
  iso ? String(iso).slice(0, 10).split("-").reverse().join("/") : "";

// ---------- WhatsApp ----------
// Normaliza telefone brasileiro: adiciona 55 automaticamente se vier só com DDD+número
export function normalizePhone(number: string) {
  let digits = (number || "").replace(/\D/g, "");
  if (digits.length >= 10 && digits.length <= 11) digits = "55" + digits;
  return digits;
}

export function waLink(number: string, text: string) {
  const digits = normalizePhone(number);
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function openWhatsApp(number: string | undefined, text: string) {
  if (!number) return false;
  const digits = normalizePhone(number);
  if (digits.length < 12) return false;
  window.open(waLink(number, text), "_blank");
  return true;
}

// ---------- Storage ----------
export async function uploadToBucket(bucket: string, path: string, file: File) {
  const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true });
  if (error) throw error;
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}
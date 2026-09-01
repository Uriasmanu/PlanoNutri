import { format, parseISO, isValid } from "date-fns";
import { ptBR } from "date-fns/locale";

export function formatDate(dateStr: string | null | undefined, fmt = "dd/MM/yyyy"): string {
  if (!dateStr) return "—";
  const d = parseISO(dateStr);
  if (!isValid(d)) return "—";
  return format(d, fmt, { locale: ptBR });
}

export function formatDateTime(dateStr: string | null | undefined): string {
  return formatDate(dateStr, "dd/MM/yyyy HH:mm");
}

export function formatTelefone(val: string): string {
  if (!val) return "—";
  return val;
}

export function getInitials(nome: string): string {
  return nome
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export function calcIdade(dataNascimento: string): number | null {
  if (!dataNascimento) return null;
  const d = parseISO(dataNascimento);
  if (!isValid(d)) return null;
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age;
}

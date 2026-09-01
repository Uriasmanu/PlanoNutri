import { readCollection } from "@/lib/db";
import type { Paciente } from "@/types";

const COLLECTION = "pacientes";

export function getPacientesByNutricionista(nutricionistaId: string): Paciente[] {
  const all = readCollection<Paciente>(COLLECTION);
  return all.filter((p) => p.nutricionistaId === nutricionistaId && !p.deletedAt);
}

export function filterPacientes(
  pacientes: Paciente[],
  opts: { q?: string; status?: string }
): Paciente[] {
  let res = pacientes;
  if (opts.q) {
    const q = opts.q.toLowerCase().trim();
    res = res.filter((p) => p.nomeCompleto.toLowerCase().includes(q) || p.email.toLowerCase().includes(q));
  }
  if (opts.status && opts.status !== "todos") {
    res = res.filter((p) => p.status === opts.status);
  }
  return res;
}

export function paginate<T>(items: T[], page: number, pageSize: number): { data: T[]; total: number; totalPages: number } {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  return { data, total, totalPages };
}

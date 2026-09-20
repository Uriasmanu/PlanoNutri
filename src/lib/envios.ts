import { addDays } from "date-fns";
import { readCollection } from "@/lib/db";
import type { Consulta, Envio, TipoAgendamento, ReferenciaRelativa } from "@/types";

export function getUltimaConsulta(pacienteId: string): Consulta | null {
  const consultas = readCollection<Consulta>("consultas")
    .filter((c) => c.pacienteId === pacienteId && !c.deletedAt)
    .sort((a, b) => new Date(b.dataConsulta).getTime() - new Date(a.dataConsulta).getTime());
  return consultas[0] ?? null;
}

export function calcularDataEnvioPrevista(params: {
  tipoAgendamento: TipoAgendamento;
  referencia?: ReferenciaRelativa;
  dias?: number;
  data?: string;
  pacienteCreatedAt: string;
  ultimaConsulta: Consulta | null;
}): string {
  if (params.tipoAgendamento === "data_fixa") {
    // params.data is a date-only "YYYY-MM-DD" string. Appending "Z" (or letting
    // `new Date("YYYY-MM-DD")` implicitly assume UTC) parses it as UTC midnight,
    // which renders as the PREVIOUS calendar day once displayed via
    // formatDate (parseISO + local-timezone format) in any timezone behind
    // UTC (e.g. Brazil, UTC-3). Parsing with an explicit local-time suffix
    // (no trailing "Z") makes JS interpret it as LOCAL midnight instead, so
    // the stored UTC instant maps back to the correct local calendar day.
    // Do not "simplify" this back to `new Date(params.data).toISOString()`.
    return new Date(`${params.data}T00:00:00`).toISOString();
  }
  let base: Date;
  if (params.referencia === "ultima_consulta" && params.ultimaConsulta) {
    // ultimaConsulta.dataConsulta is stored as a UTC-midnight ISO string
    // representing an intended calendar day (see Consultas feature, out of
    // scope to change here). Extract that Y/M/D with UTC getters and rebuild
    // a LOCAL midnight Date for the same day before running addDays, so the
    // day-granularity arithmetic and later local-timezone display agree.
    // Do not read this Date's local getters directly for the Y/M/D — they
    // would be off by one day in timezones behind UTC.
    const d = new Date(params.ultimaConsulta.dataConsulta);
    base = new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  } else {
    base = new Date(params.pacienteCreatedAt);
  }
  return addDays(base, params.dias as number).toISOString();
}

export interface EnvioEnriquecido extends Envio {
  pacienteNome: string;
  questionarioTitulo: string;
}

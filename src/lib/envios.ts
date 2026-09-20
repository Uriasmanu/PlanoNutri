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
    return new Date(params.data as string).toISOString();
  }
  const base =
    params.referencia === "ultima_consulta" && params.ultimaConsulta
      ? new Date(params.ultimaConsulta.dataConsulta)
      : new Date(params.pacienteCreatedAt);
  return addDays(base, params.dias as number).toISOString();
}

export interface EnvioEnriquecido extends Envio {
  pacienteNome: string;
  questionarioTitulo: string;
}

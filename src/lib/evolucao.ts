import { readCollection } from "@/lib/db";
import type { EvolucaoFisica } from "@/types";

const COLLECTION = "evolucao_fisica";

export function getEvolucoesByPaciente(pacienteId: string): EvolucaoFisica[] {
  const all = readCollection<EvolucaoFisica>(COLLECTION);
  return all
    .filter((e) => e.pacienteId === pacienteId)
    .sort((a, b) => new Date(a.dataAvaliacao).getTime() - new Date(b.dataAvaliacao).getTime());
}

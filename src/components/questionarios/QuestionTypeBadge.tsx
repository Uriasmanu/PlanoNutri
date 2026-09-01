"use client";

import { Badge } from "@/components/ui/badge";
import type { TipoRespostaPergunta } from "@/types";

const map: Record<TipoRespostaPergunta, { label: string; variant: "default" | "secondary" | "outline" | "success" | "warning" | "info" }> = {
  texto_livre: { label: "Texto livre", variant: "secondary" },
  multipla_escolha: { label: "Múltipla escolha", variant: "info" },
  escala: { label: "Escala", variant: "warning" },
  numerico: { label: "Numérico", variant: "default" },
  sim_nao: { label: "Sim/Não", variant: "outline" },
};

export function QuestionTypeBadge({ tipo }: { tipo: TipoRespostaPergunta }) {
  const cfg = map[tipo] || { label: tipo, variant: "secondary" as const };
  return <Badge variant={cfg.variant as any}>{cfg.label}</Badge>;
}

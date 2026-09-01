"use client";

import { Badge } from "@/components/ui/badge";
import type { StatusPaciente } from "@/types";

const map: Record<StatusPaciente, { label: string; variant: "success" | "secondary" | "warning" }> = {
  ativo: { label: "Ativo", variant: "success" },
  inativo: { label: "Inativo", variant: "secondary" },
  em_pausa: { label: "Em pausa", variant: "warning" },
};

export function StatusBadge({ status }: { status: StatusPaciente }) {
  const cfg = map[status] || { label: status, variant: "secondary" as const };
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";
import type { Consulta } from "@/types";

const TIPO_LABEL: Record<Consulta["tipo"], string> = {
  primeira_consulta: "Primeira consulta",
  retorno: "Retorno",
};

interface Props {
  consultas: Consulta[];
  onEdit: (consulta: Consulta) => void;
  onDelete: (consulta: Consulta) => void;
}

export function ConsultaList({ consultas, onEdit, onDelete }: Props) {
  if (consultas.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">Nenhuma consulta registrada ainda.</p>;
  }

  return (
    <div className="space-y-2">
      {consultas.map((c) => (
        <div key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border p-3 text-sm">
          <div>
            <span className="font-medium">{formatDate(c.dataConsulta)}</span>
            <span className="text-muted-foreground"> — {TIPO_LABEL[c.tipo]}</span>
          </div>
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(c)} title="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(c)} title="Excluir">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

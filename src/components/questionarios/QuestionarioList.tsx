"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Pencil, Trash2, Eye } from "lucide-react";
import type { Questionario } from "@/types";

const statusMap: Record<string, { label: string; variant: "success" | "secondary" | "warning" | "outline" }> = {
  rascunho: { label: "Rascunho", variant: "secondary" },
  ativo: { label: "Ativo", variant: "success" },
  inativo: { label: "Inativo", variant: "outline" },
};

export function QuestionarioList({ data, onDelete }: { data: (Questionario & { _count?: number })[]; onDelete: (id: string) => void }) {
  if (data.length === 0) return null;
  return (
    <>
      <div className="hidden md:block overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr className="border-b"><th className="text-left p-3 font-semibold">Título</th><th className="text-left p-3 font-semibold">Status</th><th className="text-left p-3 font-semibold">Perguntas</th><th className="text-right p-3 font-semibold">Ações</th></tr></thead>
          <tbody>
            {data.map((q) => (
              <tr key={q.id} className="border-b last:border-0 hover:bg-muted/50">
                <td className="p-3"><p className="font-medium">{q.titulo}</p><p className="text-xs text-muted-foreground line-clamp-1">{q.descricao || "—"}</p></td>
                <td className="p-3"><Badge variant={statusMap[q.status]?.variant as any || "secondary"}>{statusMap[q.status]?.label || q.status}</Badge></td>
                <td className="p-3">{q._count ?? "—"}</td>
                <td className="p-3 text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild title="Ver"><Link href={`/questionarios/${q.id}`}><Eye className="h-4 w-4" /></Link></Button>
                    <Button variant="ghost" size="icon" asChild title="Editar"><Link href={`/questionarios/${q.id}/editar`}><Pencil className="h-4 w-4" /></Link></Button>
                    <Button variant="ghost" size="icon" onClick={() => onDelete(q.id)} title="Excluir"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden grid gap-3">
        {data.map((q) => (
          <Card key={q.id}><CardContent className="p-4 flex justify-between gap-3">
            <div className="min-w-0"><p className="font-medium text-sm truncate">{q.titulo}</p><p className="text-xs text-muted-foreground truncate">{q.descricao || "—"}</p><div className="mt-1 flex gap-2"><Badge variant={statusMap[q.status]?.variant as any}>{statusMap[q.status]?.label}</Badge><span className="text-xs text-muted-foreground">{q._count} perguntas</span></div></div>
            <div className="flex gap-1 shrink-0"><Button variant="ghost" size="icon" asChild><Link href={`/questionarios/${q.id}/editar`}><Pencil className="h-4 w-4" /></Link></Button><Button variant="ghost" size="icon" onClick={() => onDelete(q.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button></div>
          </CardContent></Card>
        ))}
      </div>
    </>
  );
}

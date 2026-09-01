"use client";

import { useState } from "react";
import type { Pergunta } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PerguntaPreview } from "./PerguntaPreview";
import { QuestionTypeBadge } from "./QuestionTypeBadge";
import { ArrowUp, ArrowDown, X, Search } from "lucide-react";

interface Props {
  allPerguntas: Pergunta[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function QuestionarioBuilder({ allPerguntas, selectedIds, onChange }: Props) {
  const [q, setQ] = useState("");

  const filtered = allPerguntas.filter((p) => !selectedIds.includes(p.id) && (q ? p.titulo.toLowerCase().includes(q.toLowerCase()) : true));
  const selected = selectedIds.map((id) => allPerguntas.find((p) => p.id === id)).filter(Boolean) as Pergunta[];

  function add(id: string) {
    onChange([...selectedIds, id]);
  }
  function remove(idx: number) {
    const copy = [...selectedIds];
    copy.splice(idx, 1);
    onChange(copy);
  }
  function move(idx: number, dir: -1 | 1) {
    const copy = [...selectedIds];
    const ni = idx + dir;
    if (ni < 0 || ni >= copy.length) return;
    [copy[idx], copy[ni]] = [copy[ni], copy[idx]];
    onChange(copy);
  }

  return (
    <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Banco de perguntas ({filtered.length})</CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar pergunta..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
          {filtered.length === 0 ? <p className="text-sm text-muted-foreground text-center py-4">Nenhuma pergunta disponível</p> : null}
          {filtered.slice(0, 30).map((p) => (
            <div key={p.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium line-clamp-2">{p.titulo}</p>
                <div className="mt-1 flex gap-2 items-center flex-wrap">
                  <QuestionTypeBadge tipo={p.tipoResposta} />
                  {p.padrao && <span className="text-xs text-muted-foreground">• Padrão</span>}
                </div>
              </div>
              <Button size="sm" variant="outline" onClick={() => add(p.id)} className="shrink-0">Adicionar</Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle className="text-base">Questionário ({selected.length} perguntas)</CardTitle>
          <p className="text-xs text-muted-foreground">Use ↑ ↓ para reordenar. A ordem é a que o paciente verá.</p>
        </CardHeader>
        <CardContent className="space-y-3">
          {selected.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">Selecione perguntas do banco ao lado.</p> : null}
          {selected.map((p, idx) => (
            <div key={p.id} className="rounded-lg border p-3 space-y-3 bg-card">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded">{idx + 1}</span>
                    <QuestionTypeBadge tipo={p.tipoResposta} />
                  </div>
                  <p className="text-sm font-medium">{p.titulo}</p>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(idx, -1)} disabled={idx === 0} aria-label="Subir">
                    <ArrowUp className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => move(idx, 1)} disabled={idx === selected.length - 1} aria-label="Descer">
                    <ArrowDown className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => remove(idx)} aria-label="Remover">
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="rounded-md bg-muted/30 p-3">
                <PerguntaPreview pergunta={p} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

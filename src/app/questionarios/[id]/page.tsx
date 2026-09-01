"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PerguntaPreview } from "@/components/questionarios/PerguntaPreview";
import type { Pergunta } from "@/types";

export default function QuestionarioDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/questionarios/${params.id}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        setData(json.data);
      } catch (e) { setError(e instanceof Error ? e.message : "Erro"); } finally { setLoading(false); }
    }
    load();
  }, [params.id]);

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (error || !data) return <div className="max-w-3xl mx-auto"><p className="text-destructive text-sm">{error}</p><Button asChild variant="outline" className="mt-4"><Link href="/questionarios">Voltar</Link></Button></div>;

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/questionarios"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div className="flex-1 min-w-0"><h1 className="text-2xl font-bold tracking-tight truncate">{data.titulo}</h1><p className="text-sm text-muted-foreground">{data.descricao || "Sem descrição"} • <Badge variant={data.status === "ativo" ? "success" : data.status === "rascunho" ? "secondary" : "outline"}>{data.status}</Badge></p></div>
        <Button asChild variant="outline" size="sm"><Link href={`/questionarios/${data.id}/editar`}><Pencil className="h-4 w-4 mr-1" /> Editar</Link></Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Preview — como o paciente verá ({data.perguntas?.length || 0} perguntas)</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {(data.perguntas as Pergunta[] || []).map((p, idx) => (
            <div key={p.id} className="rounded-lg border p-4 space-y-3">
              <div className="text-xs font-mono text-muted-foreground">Pergunta {idx + 1}</div>
              <PerguntaPreview pergunta={p} />
            </div>
          ))}
          {(!data.perguntas || data.perguntas.length === 0) && <p className="text-sm text-muted-foreground text-center py-6">Nenhuma pergunta vinculada.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

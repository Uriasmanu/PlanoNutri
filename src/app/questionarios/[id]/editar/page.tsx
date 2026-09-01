"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { QuestionarioBuilder } from "@/components/questionarios/QuestionarioBuilder";
import type { Pergunta } from "@/types";

export default function EditarQuestionarioPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [status, setStatus] = useState("rascunho");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [allPerguntas, setAllPerguntas] = useState<Pergunta[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const [resQ, resP] = await Promise.all([
          fetch(`/api/questionarios/${params.id}`),
          fetch("/api/perguntas?pageSize=100"),
        ]);
        const jsonQ = await resQ.json();
        const jsonP = await resP.json();
        if (!resQ.ok) throw new Error(jsonQ.error);
        setTitulo(jsonQ.data.titulo);
        setDescricao(jsonQ.data.descricao || "");
        setStatus(jsonQ.data.status);
        setSelectedIds((jsonQ.data.vinculos || []).sort((a: any, b: any) => a.ordem - b.ordem).map((v: any) => v.perguntaId));
        if (resP.ok) setAllPerguntas(jsonP.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar");
      } finally { setLoading(false); }
    }
    load();
  }, [params.id]);

  async function handleSubmit() {
    setError("");
    if (!titulo.trim()) { setError("Título é obrigatório"); return; }
    if (selectedIds.length === 0) { setError("Selecione ao menos 1 pergunta"); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`/api/questionarios/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titulo, descricao: descricao || null, status, perguntaIds: selectedIds }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details ? JSON.stringify(json.details) : json.error);
      router.push("/questionarios");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally { setSubmitting(false); }
  }

  if (loading) return <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (error && !titulo) return <div className="max-w-5xl mx-auto space-y-4"><p className="text-destructive text-sm">{error}</p><Button asChild variant="outline"><Link href="/questionarios">Voltar</Link></Button></div>;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild><Link href="/questionarios"><ArrowLeft className="h-4 w-4" /></Link></Button>
        <div><h1 className="text-2xl font-bold tracking-tight">Editar questionário</h1><p className="text-sm text-muted-foreground">Reordene perguntas e ajuste dados</p></div>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="titulo">Título *</Label>
          <Input id="titulo" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select id="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="rascunho">Rascunho</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </Select>
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="descricao">Descrição</Label>
          <Textarea id="descricao" rows={2} value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <QuestionarioBuilder allPerguntas={allPerguntas} selectedIds={selectedIds} onChange={setSelectedIds} />

      <div className="flex justify-end gap-3">
        <Button variant="outline" asChild><Link href="/questionarios">Cancelar</Link></Button>
        <Button onClick={handleSubmit} disabled={submitting} className="min-h-[44px]">{submitting ? "Salvando..." : "Salvar alterações"}</Button>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import { Search, Plus, Loader2, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PerguntaForm } from "@/components/questionarios/PerguntaForm";
import { QuestionTypeBadge } from "@/components/questionarios/QuestionTypeBadge";
import { PerguntaPreview } from "@/components/questionarios/PerguntaPreview";
import type { Pergunta } from "@/types";
import type { PerguntaFormData } from "@/lib/validations/questionario";

export default function BancoPerguntasPage() {
  const [perguntas, setPerguntas] = useState<Pergunta[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [tipo, setTipo] = useState("todos");
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Pergunta | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "20", ...(q ? { q } : {}), ...(tipo !== "todos" ? { tipo } : {}) });
      const res = await fetch(`/api/perguntas?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setPerguntas(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  }, [page, q, tipo]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [q, tipo]);

  async function handleSubmit(data: PerguntaFormData) {
    setError("");
    setSubmitting(true);
    try {
      const url = editing ? `/api/perguntas/${editing.id}` : "/api/perguntas";
      const method = editing ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.details ? JSON.stringify(json.details) : json.error);
      setOpen(false);
      setEditing(null);
      fetchData();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally { setSubmitting(false); }
  }

  async function handleDelete(p: Pergunta) {
    if (p.padrao) { alert("Perguntas padrão não podem ser excluídas"); return; }
    if (!confirm(`Excluir "${p.titulo}"?`)) return;
    const res = await fetch(`/api/perguntas/${p.id}`, { method: "DELETE" });
    if (!res.ok) {
      const json = await res.json();
      alert(json.error || "Erro ao excluir");
    } else fetchData();
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Banco de perguntas</h1>
          <p className="text-sm text-muted-foreground">{total} perguntas • reutilizáveis em questionários</p>
        </div>
        <Button onClick={() => { setEditing(null); setError(""); setOpen(true); }} className="min-h-[44px]"><Plus className="h-4 w-4 mr-2" /> Nova pergunta</Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por enunciado..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={tipo} onChange={(e) => setTipo(e.target.value)} className="sm:w-[200px]">
          <option value="todos">Todos os tipos</option>
          <option value="texto_livre">Texto livre</option>
          <option value="multipla_escolha">Múltipla escolha</option>
          <option value="escala">Escala</option>
          <option value="numerico">Numérico</option>
          <option value="sim_nao">Sim/Não</option>
        </Select>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : perguntas.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center space-y-3">
            <HelpCircle className="h-10 w-10 mx-auto text-muted-foreground" />
            <h3 className="font-semibold">Nenhuma pergunta encontrada</h3>
            <p className="text-sm text-muted-foreground">Ajuste busca/filtro ou crie uma nova pergunta.</p>
          </div>
        ) : (
          <>
            <div className="grid gap-3">
              {perguntas.map((p) => (
                <Card key={p.id}>
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-sm">{p.titulo}</p>
                        <div className="flex gap-2 mt-1 flex-wrap items-center">
                          <QuestionTypeBadge tipo={p.tipoResposta} />
                          {p.padrao && <span className="text-xs bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300 px-2 py-0.5 rounded-full">Padrão</span>}
                          {p.obrigatoria && <span className="text-xs text-muted-foreground">• Obrigatória</span>}
                        </div>
                        {p.tipoResposta === "multipla_escolha" && <p className="text-xs text-muted-foreground mt-1">Opções: {(p.opcoesResposta || []).join(" • ")}</p>}
                        {p.tipoResposta === "escala" && <p className="text-xs text-muted-foreground mt-1">Escala {p.escalaMin} a {p.escalaMax}</p>}
                      </div>
                      <div className="flex gap-1 shrink-0">
                        <Button variant="outline" size="sm" onClick={() => { setEditing(p); setError(""); setOpen(true); }}>Editar</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(p)} disabled={p.padrao} title={p.padrao ? "Padrão não excluível" : "Excluir"}>{p.padrao ? "Bloqueado" : "Excluir"}</Button>
                      </div>
                    </div>
                    <div className="rounded-md bg-muted/20 p-3">
                      <PerguntaPreview pergunta={p} />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">Página {page} de {totalPages} — {total} perguntas</p>
              <div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button></div>
            </div>
          </>
        )}

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) setEditing(null); }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Editar pergunta" : "Nova pergunta"}</DialogTitle></DialogHeader>
          {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}
          <PerguntaForm defaultValues={editing || undefined} onSubmit={handleSubmit} isSubmitting={submitting} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

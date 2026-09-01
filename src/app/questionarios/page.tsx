"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Plus, Loader2, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { QuestionarioList } from "@/components/questionarios/QuestionarioList";
import type { Questionario } from "@/types";

export default function QuestionariosPage() {
  const [data, setData] = useState<(Questionario & { _count?: number })[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: "10", ...(q ? { q } : {}), ...(status !== "todos" ? { status } : {}) });
      const res = await fetch(`/api/questionarios?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setData(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, q, status]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(1); }, [q, status]);

  async function handleDelete(id: string) {
    if (!confirm("Excluir questionário?")) return;
    const res = await fetch(`/api/questionarios/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
    else alert("Erro ao excluir");
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Questionários</h1>
          <p className="text-sm text-muted-foreground">{total} questionários • <Link href="/questionarios/banco" className="text-primary hover:underline">Banco de perguntas</Link></p>
        </div>
        <Button asChild className="min-h-[44px]"><Link href="/questionarios/novo"><Plus className="h-4 w-4 mr-2" /> Novo questionário</Link></Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input placeholder="Buscar por título..." value={q} onChange={(e) => setQ(e.target.value)} className="flex-1" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-[180px]">
          <option value="todos">Todos os status</option>
          <option value="rascunho">Rascunho</option>
          <option value="ativo">Ativo</option>
          <option value="inativo">Inativo</option>
        </Select>
      </div>

      {loading ? <div className="flex justify-center py-16"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : data.length === 0 ? (
          <div className="rounded-lg border border-dashed p-10 text-center space-y-3">
            <ClipboardList className="h-10 w-10 mx-auto text-muted-foreground" />
            <h3 className="font-semibold">Nenhum questionário encontrado</h3>
            <p className="text-sm text-muted-foreground">Crie o primeiro questionário a partir do banco de perguntas.</p>
            <Button asChild><Link href="/questionarios/novo">Criar questionário</Link></Button>
          </div>
        ) : (
          <>
            <QuestionarioList data={data} onDelete={handleDelete} />
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-muted-foreground">Página {page} de {totalPages}</p>
              <div className="flex gap-2"><Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Anterior</Button><Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Próxima</Button></div>
            </div>
          </>
        )}
    </div>
  );
}

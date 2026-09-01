"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Search, Plus, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PatientTable } from "@/components/pacientes/PatientTable";
import { DeletePatientDialog } from "@/components/pacientes/DeletePatientDialog";
import type { Paciente } from "@/types";

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("ativo");
  const [loading, setLoading] = useState(true);
  const [deleteTarget, setDeleteTarget] = useState<Paciente | null>(null);
  const [deleting, setDeleting] = useState(false);
  const pageSize = 10;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), status, ...(q ? { q } : {}) });
      const res = await fetch(`/api/pacientes?${params}`);
      if (!res.ok) throw new Error("Erro ao carregar");
      const json = await res.json();
      setPacientes(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, q, status]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [q, status]);

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/pacientes/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      setDeleteTarget(null);
      fetchData();
    } catch (e) {
      console.error(e);
      alert("Erro ao excluir paciente");
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Pacientes</h1>
          <p className="text-sm text-muted-foreground">Gerencie os pacientes do consultório — {total} no total</p>
        </div>
        <Button asChild className="min-h-[44px]">
          <Link href="/pacientes/novo">
            <Plus className="h-4 w-4 mr-2" /> Novo paciente
          </Link>
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por nome ou e-mail..." value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="sm:w-[180px]">
          <option value="ativo">Ativos</option>
          <option value="inativo">Inativos</option>
          <option value="em_pausa">Em pausa</option>
          <option value="todos">Todos</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : pacientes.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center space-y-3">
          <Users className="h-10 w-10 mx-auto text-muted-foreground" />
          <h3 className="font-semibold">Nenhum paciente encontrado</h3>
          <p className="text-sm text-muted-foreground">
            {q || status !== "ativo" ? "Tente ajustar busca ou filtro." : "Cadastre o primeiro paciente para começar."}
          </p>
          <Button asChild variant="outline">
            <Link href="/pacientes/novo">Cadastrar paciente</Link>
          </Button>
        </div>
      ) : (
        <>
          <PatientTable pacientes={pacientes} onDelete={(p) => setDeleteTarget(p)} />

          <div className="flex items-center justify-between pt-2">
            <p className="text-sm text-muted-foreground">
              Página {page} de {totalPages} — {total} pacientes
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                Anterior
              </Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>
                Próxima
              </Button>
            </div>
          </div>
        </>
      )}

      <DeletePatientDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)} pacienteNome={deleteTarget?.nomeCompleto || ""} onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}

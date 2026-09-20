"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EnvioList } from "@/components/envios/EnvioList";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import type { EnvioEnriquecido } from "@/lib/envios";

export default function EnviosPage() {
  const [envios, setEnvios] = useState<EnvioEnriquecido[]>([]);
  const [status, setStatus] = useState("agendado");
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<EnvioEnriquecido | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/envios?status=${status}`);
    if (res.ok) {
      const json = await res.json();
      setEnvios(json.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/envios/${cancelTarget.id}`, { method: "DELETE" });
      if (res.ok) await load();
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Envios</h1>
        <Button asChild size="sm">
          <Link href="/envios/novo">
            <Plus className="h-4 w-4 mr-1" /> Novo agendamento
          </Link>
        </Button>
      </div>

      <div className="max-w-[220px]">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="agendado">Agendados</option>
          <option value="cancelado">Cancelados</option>
          <option value="todos">Todos</option>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <EnvioList envios={envios} onCancel={setCancelTarget} />
      )}

      <ConfirmDeleteDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancelar agendamento?"
        description="O agendamento será marcado como cancelado e sai da listagem padrão, mas continua no histórico."
        onConfirm={handleCancel}
        loading={cancelling}
      />
    </div>
  );
}

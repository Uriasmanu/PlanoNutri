"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) return null;
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vinda, {user.nome}! Visão geral do seu consultório.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Pacientes Ativos</p>
          <p className="text-3xl font-bold mt-2">—</p>
          <p className="text-xs text-muted-foreground mt-1">Disponível na v0.2</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Questionários Pendentes</p>
          <p className="text-3xl font-bold mt-2">—</p>
          <p className="text-xs text-muted-foreground mt-1">Disponível na v0.5</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Envios Agendados</p>
          <p className="text-3xl font-bold mt-2">—</p>
          <p className="text-xs text-muted-foreground mt-1">Disponível na v0.4</p>
        </div>
        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <p className="text-sm font-medium text-muted-foreground">Respostas Hoje</p>
          <p className="text-3xl font-bold mt-2">—</p>
          <p className="text-xs text-muted-foreground mt-1">Disponível na v0.5</p>
        </div>
      </div>
    </div>
  );
}

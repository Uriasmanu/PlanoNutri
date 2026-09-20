"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnvioForm } from "@/components/envios/EnvioForm";
import type { EnvioFormData } from "@/lib/validations/envio";

function NovoEnvioForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPacienteId = searchParams.get("pacienteId") || undefined;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(data: EnvioFormData) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/envios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao agendar envio");
      router.push("/envios");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao agendar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <EnvioForm defaultPacienteId={defaultPacienteId} onSubmit={handleSubmit} isSubmitting={submitting} />
    </>
  );
}

export default function NovoEnvioPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/envios">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Novo agendamento</h1>
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
        <NovoEnvioForm />
      </Suspense>
    </div>
  );
}

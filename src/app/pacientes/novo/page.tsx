"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { PatientForm } from "@/components/pacientes/PatientForm";
import type { PacienteFormData } from "@/lib/validations/paciente";
import { Button } from "@/components/ui/button";

export default function NovoPacientePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(data: PacienteFormData) {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/pacientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        const msg = json.details ? JSON.stringify(json.details) : json.error || "Erro ao salvar";
        throw new Error(msg);
      }
      router.push(`/pacientes/${json.data.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pacientes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo paciente</h1>
          <p className="text-sm text-muted-foreground">Preencha todos os campos obrigatórios</p>
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      <PatientForm onSubmit={handleSubmit} isSubmitting={submitting} submitLabel="Cadastrar paciente" />
    </div>
  );
}

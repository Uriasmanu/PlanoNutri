"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";
import { PatientForm } from "@/components/pacientes/PatientForm";
import type { PacienteFormData } from "@/lib/validations/paciente";
import { Button } from "@/components/ui/button";
import type { Paciente } from "@/types";

export default function EditarPacientePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/pacientes/${params.id}`);
        if (!res.ok) throw new Error("Paciente não encontrado");
        const json = await res.json();
        setPaciente(json.data);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [params.id]);

  async function handleSubmit(data: PacienteFormData) {
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`/api/pacientes/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao salvar");
      router.push(`/pacientes/${params.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !paciente) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <p className="text-destructive text-sm">{error}</p>
        <Button asChild variant="outline">
          <Link href="/pacientes">Voltar</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href={`/pacientes/${params.id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Editar paciente</h1>
          <p className="text-sm text-muted-foreground">{paciente?.nomeCompleto}</p>
        </div>
      </div>

      {error && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{error}</div>}

      {paciente && <PatientForm defaultValues={paciente} onSubmit={handleSubmit} isSubmitting={submitting} submitLabel="Salvar alterações" />}
    </div>
  );
}

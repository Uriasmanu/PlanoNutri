"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { envioSchema, type EnvioFormData } from "@/lib/validations/envio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Paciente, Questionario } from "@/types";

interface Props {
  defaultPacienteId?: string;
  onSubmit: (data: EnvioFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EnvioForm({ defaultPacienteId, onSubmit, isSubmitting }: Props) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [questionarios, setQuestionarios] = useState<Questionario[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [loadError, setLoadError] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EnvioFormData>({
    resolver: zodResolver(envioSchema),
    defaultValues: {
      pacienteId: defaultPacienteId || "",
      canal: "email",
      tipoAgendamento: "relativo",
      referencia: "cadastro",
    },
  });

  const tipoAgendamento = watch("tipoAgendamento");

  useEffect(() => {
    async function load() {
      try {
        const [pRes, qRes] = await Promise.all([
          fetch("/api/pacientes?status=ativo&pageSize=50"),
          fetch("/api/questionarios?status=ativo&pageSize=50"),
        ]);
        const pJson = await pRes.json();
        const qJson = await qRes.json();
        if (pRes.ok) setPacientes(pJson.data);
        if (qRes.ok) setQuestionarios(qJson.data);
      } catch (e) {
        console.error("[EnvioForm load]", e);
        setLoadError(true);
      } finally {
        setLoadingOptions(false);
      }
    }
    load();
  }, []);

  if (loadingOptions) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  if (loadError) {
    return (
      <p role="alert" className="text-sm text-destructive">
        Erro ao carregar pacientes/questionários. Tente novamente.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border p-4 bg-card">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pacienteId">Paciente *</Label>
          <Select id="pacienteId" {...register("pacienteId")}>
            <option value="">Selecione...</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nomeCompleto}
              </option>
            ))}
          </Select>
          {errors.pacienteId && <p role="alert" className="text-xs text-destructive">{errors.pacienteId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="questionarioId">Questionário *</Label>
          <Select id="questionarioId" {...register("questionarioId")}>
            <option value="">Selecione...</option>
            {questionarios.map((q) => (
              <option key={q.id} value={q.id}>
                {q.titulo}
              </option>
            ))}
          </Select>
          {errors.questionarioId && <p role="alert" className="text-xs text-destructive">{errors.questionarioId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="canal">Canal pretendido *</Label>
          <Select id="canal" {...register("canal")}>
            <option value="email">E-mail</option>
            <option value="whatsapp_manual">WhatsApp (manual)</option>
            <option value="whatsapp_api">WhatsApp (API)</option>
            <option value="qrcode">QR Code</option>
            <option value="sms">SMS</option>
          </Select>
          {errors.canal && <p role="alert" className="text-xs text-destructive">{errors.canal.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoAgendamento">Tipo de agendamento *</Label>
          <Select id="tipoAgendamento" {...register("tipoAgendamento")}>
            <option value="relativo">Prazo relativo</option>
            <option value="data_fixa">Data fixa</option>
          </Select>
          {errors.tipoAgendamento && <p role="alert" className="text-xs text-destructive">{errors.tipoAgendamento.message}</p>}
        </div>

        {tipoAgendamento === "relativo" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="referencia">Referência *</Label>
              <Select id="referencia" {...register("referencia")}>
                <option value="cadastro">Data de cadastro</option>
                <option value="ultima_consulta">Última consulta</option>
              </Select>
              {errors.referencia && <p role="alert" className="text-xs text-destructive">{errors.referencia.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dias">Dias *</Label>
              <Input id="dias" type="number" min={1} max={365} {...register("dias")} />
              {errors.dias && <p role="alert" className="text-xs text-destructive">{(errors.dias.message as string)}</p>}
            </div>
          </>
        )}

        {tipoAgendamento === "data_fixa" && (
          <div className="space-y-2">
            <Label htmlFor="data">Data *</Label>
            <Input id="data" type="date" {...register("data")} />
            {errors.data && <p role="alert" className="text-xs text-destructive">{errors.data.message}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Agendar envio"}
        </Button>
      </div>
    </form>
  );
}

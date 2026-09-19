"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { consultaSchema, type ConsultaFormData } from "@/lib/validations/consulta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface Props {
  defaultValues?: Partial<ConsultaFormData>;
  onSubmit: (data: ConsultaFormData) => Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export function ConsultaForm({ defaultValues, onSubmit, isSubmitting, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ConsultaFormData>({
    resolver: zodResolver(consultaSchema),
    defaultValues: {
      dataConsulta: defaultValues?.dataConsulta || new Date().toISOString().slice(0, 10),
      tipo: defaultValues?.tipo || "retorno",
    },
  });

  async function submit(data: ConsultaFormData) {
    await onSubmit(data);
    reset({ dataConsulta: new Date().toISOString().slice(0, 10), tipo: "retorno" });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4 rounded-lg border p-4 bg-card">
      <h4 className="font-semibold text-sm">{defaultValues ? "Editar consulta" : "Nova consulta"}</h4>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dataConsulta">Data *</Label>
          <Input id="dataConsulta" type="date" {...register("dataConsulta")} />
          {errors.dataConsulta && <p role="alert" className="text-xs text-destructive">{errors.dataConsulta.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <Select id="tipo" {...register("tipo")}>
            <option value="primeira_consulta">Primeira consulta</option>
            <option value="retorno">Retorno</option>
          </Select>
          {errors.tipo && <p role="alert" className="text-xs text-destructive">{errors.tipo.message}</p>}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : defaultValues ? "Salvar alterações" : "Adicionar consulta"}
        </Button>
      </div>
    </form>
  );
}

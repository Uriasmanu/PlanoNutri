"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { evolucaoSchema, type EvolucaoFormData } from "@/lib/validations/paciente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Props {
  onSubmit: (data: EvolucaoFormData) => Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export function EvolutionForm({ onSubmit, isSubmitting, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EvolucaoFormData>({
    resolver: zodResolver(evolucaoSchema),
    defaultValues: { dataAvaliacao: new Date().toISOString().slice(0, 10) } as any,
  });

  async function submit(data: EvolucaoFormData) {
    await onSubmit(data);
    reset({ dataAvaliacao: new Date().toISOString().slice(0, 10) } as any);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4 rounded-lg border p-4 bg-card">
      <h4 className="font-semibold text-sm">Nova medição</h4>
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="dataAvaliacao">Data *</Label>
          <Input id="dataAvaliacao" type="date" {...register("dataAvaliacao")} />
          {errors.dataAvaliacao && <p role="alert" className="text-xs text-destructive">{errors.dataAvaliacao.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="peso">Peso (kg) *</Label>
          <Input id="peso" type="number" step="0.1" {...register("peso")} />
          {errors.peso && <p role="alert" className="text-xs text-destructive">{(errors.peso.message as string)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="percentualGordura">% Gordura</Label>
          <Input id="percentualGordura" type="number" step="0.1" {...register("percentualGordura")} />
          {errors.percentualGordura && <p role="alert" className="text-xs text-destructive">{(errors.percentualGordura.message as string)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="circunferenciaCintura">Cintura (cm)</Label>
          <Input id="circunferenciaCintura" type="number" step="0.1" {...register("circunferenciaCintura")} />
          {errors.circunferenciaCintura && <p role="alert" className="text-xs text-destructive">{(errors.circunferenciaCintura.message as string)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="circunferenciaQuadril">Quadril (cm)</Label>
          <Input id="circunferenciaQuadril" type="number" step="0.1" {...register("circunferenciaQuadril")} />
          {errors.circunferenciaQuadril && <p role="alert" className="text-xs text-destructive">{(errors.circunferenciaQuadril.message as string)}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="circunferenciaBraco">Braço (cm)</Label>
          <Input id="circunferenciaBraco" type="number" step="0.1" {...register("circunferenciaBraco")} />
          {errors.circunferenciaBraco && <p role="alert" className="text-xs text-destructive">{(errors.circunferenciaBraco.message as string)}</p>}
        </div>
        <div className="space-y-2 md:col-span-3">
          <Label htmlFor="observacoes">Observações</Label>
          <Textarea id="observacoes" rows={2} {...register("observacoes")} />
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Adicionar medição"}
        </Button>
      </div>
    </form>
  );
}

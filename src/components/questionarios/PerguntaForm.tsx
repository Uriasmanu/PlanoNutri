"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { perguntaSchema, type PerguntaFormData } from "@/lib/validations/questionario";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { Pergunta } from "@/types";

interface Props {
  defaultValues?: Partial<Pergunta>;
  onSubmit: (data: PerguntaFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function PerguntaForm({ defaultValues, onSubmit, isSubmitting }: Props) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<PerguntaFormData>({
    resolver: zodResolver(perguntaSchema),
    defaultValues: {
      titulo: defaultValues?.titulo || "",
      tipoResposta: (defaultValues?.tipoResposta as any) || "texto_livre",
      opcoesResposta: defaultValues?.opcoesResposta || [],
      escalaMin: defaultValues?.escalaMin ?? 1,
      escalaMax: defaultValues?.escalaMax ?? 5,
      obrigatoria: defaultValues?.obrigatoria ?? true,
    } as any,
  });

  const tipo = watch("tipoResposta");
  const [opcoesText, setOpcoesText] = useState((defaultValues?.opcoesResposta || []).join("\n"));

  async function submit(data: PerguntaFormData) {
    const payload: PerguntaFormData = { ...data };
    if (data.tipoResposta === "multipla_escolha") {
      payload.opcoesResposta = opcoesText.split("\n").map((o) => o.trim()).filter(Boolean);
    }
    await onSubmit(payload);
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">Enunciado *</Label>
        <Textarea id="titulo" rows={2} {...register("titulo")} placeholder="Ex: Como você avalia sua adesão?" />
        {errors.titulo && <p role="alert" className="text-xs text-destructive">{errors.titulo.message}</p>}
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="tipoResposta">Tipo de resposta *</Label>
          <Select id="tipoResposta" {...register("tipoResposta")}>
            <option value="texto_livre">Texto livre</option>
            <option value="multipla_escolha">Múltipla escolha</option>
            <option value="escala">Escala</option>
            <option value="numerico">Numérico</option>
            <option value="sim_nao">Sim/Não</option>
          </Select>
          {errors.tipoResposta && <p role="alert" className="text-xs text-destructive">{errors.tipoResposta.message as string}</p>}
        </div>

        <div className="space-y-2 flex items-end gap-2">
          <label className="flex items-center gap-2 text-sm pb-2">
            <input type="checkbox" {...register("obrigatoria")} defaultChecked={defaultValues?.obrigatoria ?? true} className="h-4 w-4" />
            Obrigatória
          </label>
        </div>
      </div>

      {tipo === "multipla_escolha" && (
        <div className="space-y-2">
          <Label htmlFor="opcoes">Opções (uma por linha, mínimo 2) *</Label>
          <Textarea id="opcoes" rows={4} value={opcoesText} onChange={(e) => setOpcoesText(e.target.value)} placeholder={"Opção A\nOpção B\nOpção C"} />
          {errors.opcoesResposta && <p role="alert" className="text-xs text-destructive">{(errors.opcoesResposta.message as string)}</p>}
        </div>
      )}

      {tipo === "escala" && (
        <div className="grid gap-4 grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="escalaMin">Escala mínimo *</Label>
            <Input id="escalaMin" type="number" {...register("escalaMin")} />
            {errors.escalaMin && <p role="alert" className="text-xs text-destructive">{(errors.escalaMin.message as string)}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="escalaMax">Escala máximo *</Label>
            <Input id="escalaMax" type="number" {...register("escalaMax")} />
            {errors.escalaMax && <p role="alert" className="text-xs text-destructive">{(errors.escalaMax.message as string)}</p>}
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting} className="min-h-[44px]">{isSubmitting ? "Salvando..." : "Salvar pergunta"}</Button>
      </div>
    </form>
  );
}

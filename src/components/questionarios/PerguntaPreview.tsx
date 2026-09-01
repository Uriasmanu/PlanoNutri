"use client";

import type { Pergunta } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function PerguntaPreview({ pergunta }: { pergunta: Pergunta }) {
  const id = `preview-${pergunta.id}`;
  switch (pergunta.tipoResposta) {
    case "texto_livre":
      return (
        <div className="space-y-1">
          <Label htmlFor={id}>{pergunta.titulo} {pergunta.obrigatoria && "*"}</Label>
          <Textarea id={id} placeholder="Resposta livre" disabled rows={2} />
        </div>
      );
    case "multipla_escolha":
      return (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{pergunta.titulo} {pergunta.obrigatoria && "*"}</legend>
          <div className="flex flex-col gap-2">
            {(pergunta.opcoesResposta || []).map((op, i) => (
              <label key={i} className="flex items-center gap-2 text-sm">
                <input type="radio" name={id} disabled className="h-4 w-4" /> {op}
              </label>
            ))}
          </div>
        </fieldset>
      );
    case "escala":
      return (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{pergunta.titulo} {pergunta.obrigatoria && "*"}</legend>
          <div className="flex gap-2 flex-wrap">
            {Array.from({ length: (pergunta.escalaMax! - pergunta.escalaMin! + 1) }, (_, i) => {
              const v = pergunta.escalaMin! + i;
              return (
                <label key={v} className="flex flex-col items-center gap-1 text-xs">
                  <input type="radio" name={id} disabled className="h-4 w-4" />
                  {v}
                </label>
              );
            })}
          </div>
        </fieldset>
      );
    case "numerico":
      return (
        <div className="space-y-1">
          <Label htmlFor={id}>{pergunta.titulo} {pergunta.obrigatoria && "*"}</Label>
          <Input id={id} type="number" placeholder="0" disabled />
        </div>
      );
    case "sim_nao":
      return (
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{pergunta.titulo} {pergunta.obrigatoria && "*"}</legend>
          <div className="flex gap-4">
            <label className="flex items-center gap-2 text-sm"><input type="radio" name={id} disabled /> Sim</label>
            <label className="flex items-center gap-2 text-sm"><input type="radio" name={id} disabled /> Não</label>
          </div>
        </fieldset>
      );
    default:
      return <p className="text-sm">{pergunta.titulo}</p>;
  }
}

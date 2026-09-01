"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { pacienteSchema, type PacienteFormData } from "@/lib/validations/paciente";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Paciente } from "@/types";

interface Props {
  defaultValues?: Partial<Paciente>;
  onSubmit: (data: PacienteFormData) => Promise<void>;
  isSubmitting?: boolean;
  submitLabel?: string;
}

export function PatientForm({ defaultValues, onSubmit, isSubmitting, submitLabel = "Salvar" }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PacienteFormData>({
    resolver: zodResolver(pacienteSchema),
    defaultValues: {
      nomeCompleto: defaultValues?.nomeCompleto || "",
      dataNascimento: defaultValues?.dataNascimento ? defaultValues.dataNascimento.slice(0, 10) : "",
      sexo: (defaultValues?.sexo as any) || "F",
      telefone: defaultValues?.telefone || "",
      email: defaultValues?.email || "",
      pesoInicial: defaultValues?.pesoInicial as any,
      altura: defaultValues?.altura as any,
      percentualGordura: defaultValues?.percentualGordura as any,
      circunferenciaCintura: defaultValues?.circunferenciaCintura as any,
      circunferenciaQuadril: defaultValues?.circunferenciaQuadril as any,
      circunferenciaBraco: defaultValues?.circunferenciaBraco as any,
      objetivo: (defaultValues?.objetivo as any) || "emagrecimento",
      restricoesAlimentares: defaultValues?.restricoesAlimentares || "",
      historicoClinico: defaultValues?.historicoClinico || "",
      nivelAtividadeFisica: (defaultValues?.nivelAtividadeFisica as any) || "moderado",
      observacoes: defaultValues?.observacoes || "",
      status: (defaultValues?.status as any) || "ativo",
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados pessoais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados pessoais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="nomeCompleto">Nome completo *</Label>
            <Input id="nomeCompleto" {...register("nomeCompleto")} aria-describedby={errors.nomeCompleto ? "err-nome" : undefined} />
            {errors.nomeCompleto && <p id="err-nome" role="alert" className="text-xs text-destructive">{errors.nomeCompleto.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="dataNascimento">Data de nascimento *</Label>
            <Input id="dataNascimento" type="date" {...register("dataNascimento")} />
            {errors.dataNascimento && <p role="alert" className="text-xs text-destructive">{errors.dataNascimento.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="sexo">Sexo *</Label>
            <Select id="sexo" {...register("sexo")}>
              <option value="F">Feminino</option>
              <option value="M">Masculino</option>
              <option value="Outro">Outro</option>
            </Select>
            {errors.sexo && <p role="alert" className="text-xs text-destructive">{errors.sexo.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone *</Label>
            <Input id="telefone" placeholder="(11) 99999-9999" {...register("telefone")} />
            {errors.telefone && <p role="alert" className="text-xs text-destructive">{errors.telefone.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail *</Label>
            <Input id="email" type="email" {...register("email")} />
            {errors.email && <p role="alert" className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select id="status" {...register("status")}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
              <option value="em_pausa">Em pausa</option>
            </Select>
            {errors.status && <p role="alert" className="text-xs text-destructive">{errors.status.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Dados físicos iniciais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados físicos iniciais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="pesoInicial">Peso inicial (kg) *</Label>
            <Input id="pesoInicial" type="number" step="0.1" placeholder="68.5" {...register("pesoInicial")} />
            {errors.pesoInicial && <p role="alert" className="text-xs text-destructive">{(errors.pesoInicial.message as string)}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="altura">Altura (m) *</Label>
            <Input id="altura" type="number" step="0.01" placeholder="1.65" {...register("altura")} />
            {errors.altura && <p role="alert" className="text-xs text-destructive">{(errors.altura.message as string)}</p>}
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
        </CardContent>
      </Card>

      {/* Objetivo e histórico */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Objetivo e histórico</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="objetivo">Objetivo *</Label>
            <Select id="objetivo" {...register("objetivo")}>
              <option value="emagrecimento">Emagrecimento</option>
              <option value="hipertrofia">Hipertrofia</option>
              <option value="reeducacao_alimentar">Reeducação alimentar</option>
              <option value="controle_doenca">Controle de doença</option>
            </Select>
            {errors.objetivo && <p role="alert" className="text-xs text-destructive">{errors.objetivo.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="nivelAtividadeFisica">Nível atividade *</Label>
            <Select id="nivelAtividadeFisica" {...register("nivelAtividadeFisica")}>
              <option value="sedentario">Sedentário</option>
              <option value="leve">Leve</option>
              <option value="moderado">Moderado</option>
              <option value="intenso">Intenso</option>
            </Select>
            {errors.nivelAtividadeFisica && <p role="alert" className="text-xs text-destructive">{errors.nivelAtividadeFisica.message}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="restricoesAlimentares">Restrições / alergias</Label>
            <Textarea id="restricoesAlimentares" rows={2} placeholder="Ex: intolerância à lactose, alergia a castanhas" {...register("restricoesAlimentares")} />
            {errors.restricoesAlimentares && <p role="alert" className="text-xs text-destructive">{errors.restricoesAlimentares.message}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="historicoClinico">Histórico clínico</Label>
            <Textarea id="historicoClinico" rows={3} placeholder="Doenças pré-existentes, medicamentos em uso..." {...register("historicoClinico")} />
            {errors.historicoClinico && <p role="alert" className="text-xs text-destructive">{errors.historicoClinico.message}</p>}
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="observacoes">Observações gerais</Label>
            <Textarea id="observacoes" rows={2} placeholder="Campo livre" {...register("observacoes")} />
            {errors.observacoes && <p role="alert" className="text-xs text-destructive">{(errors.observacoes.message as string)}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button type="submit" disabled={isSubmitting} className="min-w-[140px] min-h-[44px]">
          {isSubmitting ? "Salvando..." : submitLabel}
        </Button>
      </div>
    </form>
  );
}

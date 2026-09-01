import { z } from "zod";

const sexoEnum = z.enum(["M", "F", "Outro"], { required_error: "Sexo é obrigatório" });
const objetivoEnum = z.enum(["emagrecimento", "hipertrofia", "reeducacao_alimentar", "controle_doenca"], {
  required_error: "Objetivo é obrigatório",
});
const nivelEnum = z.enum(["sedentario", "leve", "moderado", "intenso"], {
  required_error: "Nível de atividade é obrigatório",
});
const statusEnum = z.enum(["ativo", "inativo", "em_pausa"], {
  required_error: "Status é obrigatório",
});

function parseOptionalNumber(val: unknown) {
  if (val === "" || val === null || val === undefined) return null;
  if (typeof val === "number") return val;
  if (typeof val === "string") {
    const n = Number(val.replace(",", "."));
    return isNaN(n) ? val : n;
  }
  return val;
}

export const pacienteSchema = z.object({
  nomeCompleto: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(120, "Nome muito longo").trim(),
  dataNascimento: z
    .string()
    .min(1, "Data de nascimento é obrigatória")
    .refine((v) => !isNaN(Date.parse(v)), "Data inválida")
    .refine((v) => {
      const d = new Date(v);
      const now = new Date();
      return d <= now;
    }, "Data não pode ser no futuro")
    .refine((v) => {
      const d = new Date(v);
      const now = new Date();
      const age = now.getFullYear() - d.getFullYear();
      return age <= 120;
    }, "Idade não pode ser maior que 120 anos"),
  sexo: sexoEnum,
  telefone: z.string().min(8, "Telefone é obrigatório").max(20, "Telefone muito longo").trim(),
  email: z.string().email("E-mail inválido").max(120).trim().toLowerCase(),
  pesoInicial: z.preprocess(parseOptionalNumber, z.number({ required_error: "Peso é obrigatório" }).min(20, "Peso mínimo 20kg").max(500, "Peso máximo 500kg")),
  altura: z.preprocess(parseOptionalNumber, z.number({ required_error: "Altura é obrigatória" }).min(0.5, "Altura mínima 0,5m").max(2.5, "Altura máxima 2,5m")),
  percentualGordura: z.preprocess(parseOptionalNumber, z.number().min(0).max(80).nullable().optional()),
  circunferenciaCintura: z.preprocess(parseOptionalNumber, z.number().min(20).max(300).nullable().optional()),
  circunferenciaQuadril: z.preprocess(parseOptionalNumber, z.number().min(20).max(300).nullable().optional()),
  circunferenciaBraco: z.preprocess(parseOptionalNumber, z.number().min(10).max(100).nullable().optional()),
  objetivo: objetivoEnum,
  restricoesAlimentares: z.string().max(2000).optional().default(""),
  historicoClinico: z.string().max(5000).optional().default(""),
  nivelAtividadeFisica: nivelEnum,
  observacoes: z.string().max(5000).nullable().optional(),
  status: statusEnum,
});

export const pacienteUpdateSchema = pacienteSchema.partial();

export const evolucaoSchema = z.object({
  dataAvaliacao: z
    .string()
    .min(1, "Data é obrigatória")
    .refine((v) => !isNaN(Date.parse(v)), "Data inválida")
    .refine((v) => new Date(v) <= new Date(), "Data não pode ser no futuro"),
  peso: z.preprocess(parseOptionalNumber, z.number({ required_error: "Peso é obrigatório" }).min(1, "Peso deve ser maior que 0").max(500)),
  percentualGordura: z.preprocess(parseOptionalNumber, z.number().min(0).max(80).nullable().optional()),
  circunferenciaCintura: z.preprocess(parseOptionalNumber, z.number().min(20).max(300).nullable().optional()),
  circunferenciaQuadril: z.preprocess(parseOptionalNumber, z.number().min(20).max(300).nullable().optional()),
  circunferenciaBraco: z.preprocess(parseOptionalNumber, z.number().min(10).max(100).nullable().optional()),
  observacoes: z.string().max(5000).nullable().optional(),
});

export type PacienteFormData = z.infer<typeof pacienteSchema>;
export type EvolucaoFormData = z.infer<typeof evolucaoSchema>;

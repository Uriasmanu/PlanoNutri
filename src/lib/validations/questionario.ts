import { z } from "zod";

const tipoEnum = z.enum(["texto_livre", "multipla_escolha", "escala", "numerico", "sim_nao"]);
const statusEnum = z.enum(["rascunho", "ativo", "inativo"]);

export const perguntaSchema = z
  .object({
    titulo: z.string().min(3, "Título deve ter pelo menos 3 caracteres").max(300).trim(),
    tipoResposta: tipoEnum,
    opcoesResposta: z.array(z.string().min(1).max(120).trim()).nullable().optional(),
    escalaMin: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().min(0).max(10).nullable().optional()),
    escalaMax: z.preprocess((v) => (v === "" || v === null || v === undefined ? null : Number(v)), z.number().min(1).max(20).nullable().optional()),
    obrigatoria: z.boolean().optional().default(true),
  })
  .superRefine((data, ctx) => {
    if (data.tipoResposta === "multipla_escolha") {
      const ops = data.opcoesResposta || [];
      const clean = ops.map((o) => o.trim()).filter(Boolean);
      if (clean.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["opcoesResposta"], message: "Múltipla escolha exige pelo menos 2 opções" });
      }
      if (clean.length > 20) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["opcoesResposta"], message: "Máximo 20 opções" });
      }
      const uniq = new Set(clean);
      if (uniq.size !== clean.length) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["opcoesResposta"], message: "Opções não podem se repetir" });
      }
    }
    if (data.tipoResposta === "escala") {
      if (data.escalaMin === null || data.escalaMin === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["escalaMin"], message: "escalaMin é obrigatório para tipo escala" });
      }
      if (data.escalaMax === null || data.escalaMax === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["escalaMax"], message: "escalaMax é obrigatório para tipo escala" });
      }
      if (data.escalaMin !== null && data.escalaMax !== null && data.escalaMin !== undefined && data.escalaMax !== undefined) {
        if (data.escalaMin >= data.escalaMax) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["escalaMax"], message: "escalaMax deve ser maior que escalaMin" });
        }
        if (data.escalaMax - data.escalaMin > 10) {
          ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["escalaMax"], message: "Intervalo máximo 10" });
        }
      }
    }
  });

export const perguntaUpdateSchema = perguntaSchema.partial();

export const questionarioSchema = z.object({
  titulo: z.string().min(2, "Título deve ter pelo menos 2 caracteres").max(120).trim(),
  descricao: z.string().max(2000).nullable().optional(),
  status: statusEnum.optional().default("rascunho"),
  perguntaIds: z.array(z.string().uuid("ID inválido")).min(1, "Selecione ao menos 1 pergunta").max(50),
});

export const questionarioUpdateSchema = questionarioSchema.partial().extend({
  perguntaIds: z.array(z.string().uuid()).min(1).max(50).optional(),
});

export type PerguntaFormData = z.infer<typeof perguntaSchema>;
export type QuestionarioFormData = z.infer<typeof questionarioSchema>;

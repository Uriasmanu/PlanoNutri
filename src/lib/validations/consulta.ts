import { z } from "zod";

const tipoConsultaEnum = z.enum(["primeira_consulta", "retorno"], {
  required_error: "Tipo é obrigatório",
});

export const consultaSchema = z.object({
  dataConsulta: z
    .string()
    .min(1, "Data é obrigatória")
    .refine((v) => !isNaN(Date.parse(v)), "Data inválida")
    .refine((v) => new Date(v) <= new Date(), "Data não pode ser no futuro"),
  tipo: tipoConsultaEnum,
});

export type ConsultaFormData = z.infer<typeof consultaSchema>;

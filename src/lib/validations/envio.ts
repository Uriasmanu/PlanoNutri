import { z } from "zod";

const canalEnum = z.enum(["email", "whatsapp_manual", "whatsapp_api", "qrcode", "sms"], {
  required_error: "Canal é obrigatório",
});
const tipoAgendamentoEnum = z.enum(["relativo", "data_fixa"], {
  required_error: "Tipo de agendamento é obrigatório",
});
const referenciaEnum = z.enum(["cadastro", "ultima_consulta"]);

export const envioSchema = z
  .object({
    pacienteId: z.string().uuid("Paciente inválido"),
    questionarioId: z.string().uuid("Questionário inválido"),
    canal: canalEnum,
    tipoAgendamento: tipoAgendamentoEnum,
    referencia: referenciaEnum.optional(),
    dias: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
      z.number().int("Deve ser um número inteiro").min(1, "Mínimo 1 dia").max(365, "Máximo 365 dias").optional()
    ),
    data: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipoAgendamento === "relativo") {
      if (!data.referencia) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["referencia"], message: "Referência é obrigatória" });
      }
      if (data.dias === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dias"], message: "Quantidade de dias é obrigatória" });
      }
    }
    if (data.tipoAgendamento === "data_fixa") {
      if (!data.data || isNaN(Date.parse(data.data))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["data"], message: "Data é obrigatória e deve ser válida" });
      }
    }
  });

export type EnvioFormData = z.infer<typeof envioSchema>;

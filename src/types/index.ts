export interface Usuario {
  id: string;
  email: string;
  nome: string;
  senhaHash: string;
  createdAt: string;
  updatedAt: string;
}

export type StatusPaciente = "ativo" | "inativo" | "em_pausa";

export type Sexo = "M" | "F" | "Outro";

export type ObjetivoPaciente =
  | "emagrecimento"
  | "hipertrofia"
  | "reeducacao_alimentar"
  | "controle_doenca";

export type NivelAtividadeFisica =
  | "sedentario"
  | "leve"
  | "moderado"
  | "intenso";

export interface Paciente {
  id: string;
  nutricionistaId: string;
  nomeCompleto: string;
  dataNascimento: string;
  sexo: Sexo;
  telefone: string;
  email: string;
  pesoInicial: number;
  altura: number;
  percentualGordura: number | null;
  circunferenciaCintura: number | null;
  circunferenciaQuadril: number | null;
  circunferenciaBraco: number | null;
  objetivo: ObjetivoPaciente;
  restricoesAlimentares: string;
  historicoClinico: string;
  nivelAtividadeFisica: NivelAtividadeFisica;
  observacoes: string | null;
  status: StatusPaciente;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface EvolucaoFisica {
  id: string;
  pacienteId: string;
  dataAvaliacao: string;
  peso: number;
  percentualGordura: number | null;
  circunferenciaCintura: number | null;
  circunferenciaQuadril: number | null;
  circunferenciaBraco: number | null;
  observacoes: string | null;
  createdAt: string;
}

export type TipoRespostaPergunta =
  | "texto_livre"
  | "multipla_escolha"
  | "escala"
  | "numerico"
  | "sim_nao";

export interface Pergunta {
  id: string;
  nutricionistaId: string;
  titulo: string;
  tipoResposta: TipoRespostaPergunta;
  opcoesResposta: string[] | null;
  escalaMin: number | null;
  escalaMax: number | null;
  obrigatoria: boolean;
  padrao: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export type StatusQuestionario = "rascunho" | "ativo" | "inativo";

export interface Questionario {
  id: string;
  nutricionistaId: string;
  titulo: string;
  descricao: string | null;
  status: StatusQuestionario;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface QuestionarioPergunta {
  id: string;
  questionarioId: string;
  perguntaId: string;
  ordem: number;
  createdAt: string;
}

export type CanalEnvio =
  | "email"
  | "whatsapp_manual"
  | "whatsapp_api"
  | "qrcode"
  | "sms";

export type TipoAgendamento = "relativo" | "data_fixa" | "recorrencia";

export type StatusEnvio =
  | "agendado"
  | "pendente_envio"
  | "enviado"
  | "respondido"
  | "atrasado"
  | "cancelado";

export interface Envio {
  id: string;
  nutricionistaId: string;
  pacienteId: string;
  questionarioId: string;
  canal: CanalEnvio;
  tipoAgendamento: TipoAgendamento;
  configuracaoAgendamento: Record<string, unknown>;
  dataEnvioPrevista: string;
  dataEnvioEfetiva: string | null;
  status: StatusEnvio;
  token: string | null;
  respondidoEm: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface Resposta {
  id: string;
  envioId: string;
  pacienteId: string;
  questionarioId: string;
  respondidoEm: string;
  createdAt: string;
  deletedAt: string | null;
}

export interface RespostaItem {
  id: string;
  respostaId: string;
  perguntaId: string;
  valorTexto: string | null;
  valorNumerico: number | null;
  valorSimNao: boolean | null;
  valorOpcao: string | null;
  valorEscala: number | null;
  createdAt: string;
}

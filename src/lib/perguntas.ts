import { readCollection, writeCollection } from "@/lib/db";
import type { Pergunta } from "@/types";

const COL = "perguntas";

const SEED_TITULOS: Array<{ titulo: string; tipoResposta: Pergunta["tipoResposta"]; opcoesResposta?: string[] | null; escalaMin?: number | null; escalaMax?: number | null }> = [
  { titulo: "Como você avalia sua adesão às orientações da última consulta?", tipoResposta: "escala", escalaMin: 1, escalaMax: 5 },
  { titulo: "Quais dificuldades encontrou para seguir o plano?", tipoResposta: "texto_livre" },
  { titulo: "Você apresentou algum sintoma (dor de cabeça, náusea, etc.)?", tipoResposta: "texto_livre" },
  { titulo: "Qual seu peso atual (kg)?", tipoResposta: "numerico" },
  { titulo: "Como está seu nível de energia no dia a dia?", tipoResposta: "escala", escalaMin: 1, escalaMax: 5 },
  { titulo: "Como avalia sua qualidade de sono?", tipoResposta: "escala", escalaMin: 1, escalaMax: 5 },
  { titulo: "Como está seu funcionamento intestinal/evacuação?", tipoResposta: "texto_livre" },
  { titulo: "Com que frequência praticou atividade física nesta semana?", tipoResposta: "multipla_escolha", opcoesResposta: ["Nenhuma vez", "1-2 vezes", "3-4 vezes", "5 ou mais vezes"] },
];

export function ensureSeedPerguntas(nutricionistaId: string): void {
  const all = readCollection<Pergunta>(COL);
  const mine = all.filter((p) => p.nutricionistaId === nutricionistaId && !p.deletedAt);
  if (mine.length > 0) return;
  const now = new Date().toISOString();
  const seed: Pergunta[] = SEED_TITULOS.map((s) => ({
    id: crypto.randomUUID(),
    nutricionistaId,
    titulo: s.titulo,
    tipoResposta: s.tipoResposta,
    opcoesResposta: (s.opcoesResposta as string[]) || null,
    escalaMin: s.escalaMin ?? null,
    escalaMax: s.escalaMax ?? null,
    obrigatoria: true,
    padrao: true,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  }));
  writeCollection(COL, [...all, ...seed]);
}

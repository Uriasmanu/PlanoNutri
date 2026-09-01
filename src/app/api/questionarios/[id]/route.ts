import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/db";
import { getAuth } from "@/lib/auth-helpers";
import { questionarioUpdateSchema } from "@/lib/validations/questionario";
import type { Questionario, QuestionarioPergunta, Pergunta } from "@/types";

const Q_COL = "questionarios";
const QP_COL = "questionario_perguntas";
const P_COL = "perguntas";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;
    const allQ = readCollection<Questionario>(Q_COL);
    const q = allQ.find((x) => x.id === id && x.nutricionistaId === auth.nutricionistaId && !x.deletedAt);
    if (!q) return NextResponse.json({ error: "Questionário não encontrado" }, { status: 404 });

    const qps = readCollection<QuestionarioPergunta>(QP_COL)
      .filter((x) => x.questionarioId === id)
      .sort((a, b) => a.ordem - b.ordem);
    const perguntas = readCollection<Pergunta>(P_COL);
    const PerguntasOrdenadas = qps
      .map((qp) => perguntas.find((p) => p.id === qp.perguntaId && !p.deletedAt))
      .filter(Boolean) as Pergunta[];

    return NextResponse.json({ data: { ...q, perguntas: PerguntasOrdenadas, vinculos: qps } });
  } catch (e) {
    console.error("[questionarios GET id]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;
    const allQ = readCollection<Questionario>(Q_COL);
    const idx = allQ.findIndex((x) => x.id === id && x.nutricionistaId === auth.nutricionistaId && !x.deletedAt);
    if (idx === -1) return NextResponse.json({ error: "Questionário não encontrado" }, { status: 404 });

    const body = await request.json();
    const parsed = questionarioUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
    const d = parsed.data;

    if (d.perguntaIds) {
      const perguntas = readCollection<Pergunta>(P_COL);
      for (const pid of d.perguntaIds) {
        const p = perguntas.find((x) => x.id === pid && x.nutricionistaId === auth.nutricionistaId && !x.deletedAt);
        if (!p) return NextResponse.json({ error: `Pergunta não encontrada: ${pid}` }, { status: 404 });
      }
      // rewrite vinculos
      const allQP = readCollection<QuestionarioPergunta>(QP_COL).filter((x) => x.questionarioId !== id);
      const now = new Date().toISOString();
      const newQPs: QuestionarioPergunta[] = d.perguntaIds.map((pid, ordem) => ({
        id: crypto.randomUUID(),
        questionarioId: id,
        perguntaId: pid,
        ordem,
        createdAt: now,
      }));
      writeCollection(QP_COL, [...allQP, ...newQPs]);
    }

    if (d.titulo !== undefined) allQ[idx].titulo = d.titulo;
    if (d.descricao !== undefined) allQ[idx].descricao = d.descricao ?? null;
    if (d.status !== undefined) allQ[idx].status = d.status as Questionario["status"];
    allQ[idx].updatedAt = new Date().toISOString();
    writeCollection(Q_COL, allQ);

    return NextResponse.json({ data: allQ[idx] });
  } catch (e) {
    console.error("[questionarios PUT]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;
    const allQ = readCollection<Questionario>(Q_COL);
    const idx = allQ.findIndex((x) => x.id === id && x.nutricionistaId === auth.nutricionistaId && !x.deletedAt);
    if (idx === -1) return NextResponse.json({ error: "Questionário não encontrado" }, { status: 404 });
    allQ[idx] = { ...allQ[idx], deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    writeCollection(Q_COL, allQ);
    return NextResponse.json({ message: "Questionário removido" });
  } catch (e) {
    console.error("[questionarios DELETE]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

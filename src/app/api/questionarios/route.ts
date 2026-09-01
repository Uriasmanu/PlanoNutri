import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/db";
import { getAuth } from "@/lib/auth-helpers";
import { questionarioSchema } from "@/lib/validations/questionario";
import type { Questionario, QuestionarioPergunta, Pergunta } from "@/types";

const Q_COL = "questionarios";
const QP_COL = "questionario_perguntas";
const P_COL = "perguntas";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || undefined;
    const status = searchParams.get("status") || undefined;
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Math.min(Number(searchParams.get("pageSize") || "10"), 50);

    let all = readCollection<Questionario>(Q_COL).filter((x) => x.nutricionistaId === auth.nutricionistaId && !x.deletedAt);
    if (q) {
      const qq = q.toLowerCase().trim();
      all = all.filter((x) => x.titulo.toLowerCase().includes(qq));
    }
    if (status && status !== "todos") all = all.filter((x) => x.status === status);
    all = all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = all.slice((safePage - 1) * pageSize, safePage * pageSize);

    // enrich with count
    const qps = readCollection<QuestionarioPergunta>(QP_COL);
    const enriched = data.map((qq) => ({ ...qq, _count: qps.filter((qp) => qp.questionarioId === qq.id).length }));

    return NextResponse.json({ data: enriched, total, page: safePage, pageSize, totalPages });
  } catch (e) {
    console.error("[questionarios GET]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const body = await request.json();
    const parsed = questionarioSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });

    const d = parsed.data;
    // verify perguntaIds belong to nutricionista and not deleted
    const perguntas = readCollection<Pergunta>(P_COL);
    for (const pid of d.perguntaIds) {
      const p = perguntas.find((x) => x.id === pid && x.nutricionistaId === auth.nutricionistaId && !x.deletedAt);
      if (!p) return NextResponse.json({ error: `Pergunta não encontrada: ${pid}` }, { status: 404 });
    }

    const now = new Date().toISOString();
    const questionario: Questionario = {
      id: crypto.randomUUID(),
      nutricionistaId: auth.nutricionistaId,
      titulo: d.titulo,
      descricao: d.descricao ?? null,
      status: d.status ?? "rascunho",
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const qps: QuestionarioPergunta[] = d.perguntaIds.map((pid, idx) => ({
      id: crypto.randomUUID(),
      questionarioId: questionario.id,
      perguntaId: pid,
      ordem: idx,
      createdAt: now,
    }));

    const allQ = readCollection<Questionario>(Q_COL);
    allQ.push(questionario);
    writeCollection(Q_COL, allQ);
    const allQP = readCollection<QuestionarioPergunta>(QP_COL);
    writeCollection(QP_COL, [...allQP, ...qps]);

    return NextResponse.json({ data: questionario }, { status: 201 });
  } catch (e) {
    console.error("[questionarios POST]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

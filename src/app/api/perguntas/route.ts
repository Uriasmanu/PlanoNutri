import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/db";
import { getAuth } from "@/lib/auth-helpers";
import { perguntaSchema } from "@/lib/validations/questionario";
import { ensureSeedPerguntas } from "@/lib/perguntas";
import type { Pergunta } from "@/types";

const COL = "perguntas";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    ensureSeedPerguntas(auth.nutricionistaId);

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || undefined;
    const tipo = searchParams.get("tipo") || undefined;
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Math.min(Number(searchParams.get("pageSize") || "20"), 50);

    let all = readCollection<Pergunta>(COL).filter((p) => p.nutricionistaId === auth.nutricionistaId && !p.deletedAt);

    if (q) {
      const qq = q.toLowerCase().trim();
      all = all.filter((p) => p.titulo.toLowerCase().includes(qq));
    }
    if (tipo && tipo !== "todos") all = all.filter((p) => p.tipoResposta === tipo);

    all = all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = all.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const data = all.slice((safePage - 1) * pageSize, safePage * pageSize);

    return NextResponse.json({ data, total, page: safePage, pageSize, totalPages });
  } catch (e) {
    console.error("[perguntas GET]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const body = await request.json();
    const parsed = perguntaSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });

    const d = parsed.data;
    const now = new Date().toISOString();
    const pergunta: Pergunta = {
      id: crypto.randomUUID(),
      nutricionistaId: auth.nutricionistaId,
      titulo: d.titulo,
      tipoResposta: d.tipoResposta,
      opcoesResposta: d.tipoResposta === "multipla_escolha" ? (d.opcoesResposta as string[]).map((o) => o.trim()) : null,
      escalaMin: d.tipoResposta === "escala" ? (d.escalaMin as number) : null,
      escalaMax: d.tipoResposta === "escala" ? (d.escalaMax as number) : null,
      obrigatoria: d.obrigatoria ?? true,
      padrao: false,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const all = readCollection<Pergunta>(COL);
    all.push(pergunta);
    writeCollection(COL, all);
    return NextResponse.json({ data: pergunta }, { status: 201 });
  } catch (e) {
    console.error("[perguntas POST]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

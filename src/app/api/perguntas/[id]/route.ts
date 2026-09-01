import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/db";
import { getAuth } from "@/lib/auth-helpers";
import { perguntaSchema } from "@/lib/validations/questionario";
import type { Pergunta } from "@/types";

const COL = "perguntas";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;
    const all = readCollection<Pergunta>(COL);
    const p = all.find((x) => x.id === id && x.nutricionistaId === auth.nutricionistaId && !x.deletedAt);
    if (!p) return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
    return NextResponse.json({ data: p });
  } catch (e) {
    console.error("[perguntas GET id]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;
    const all = readCollection<Pergunta>(COL);
    const idx = all.findIndex((x) => x.id === id && x.nutricionistaId === auth.nutricionistaId && !x.deletedAt);
    if (idx === -1) return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });

    const body = await request.json();
    // ignore padrao from client
    const { padrao: _padrao, ...rest } = body;
    const merged = { ...all[idx], ...rest };
    const parsed = perguntaSchema.safeParse(merged);
    if (!parsed.success) return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });

    const d = parsed.data;
    all[idx] = {
      ...all[idx],
      titulo: d.titulo,
      tipoResposta: d.tipoResposta,
      opcoesResposta: d.tipoResposta === "multipla_escolha" ? (d.opcoesResposta as string[]).map((o) => o.trim()) : null,
      escalaMin: d.tipoResposta === "escala" ? (d.escalaMin as number) : null,
      escalaMax: d.tipoResposta === "escala" ? (d.escalaMax as number) : null,
      obrigatoria: d.obrigatoria ?? true,
      updatedAt: new Date().toISOString(),
    };
    writeCollection(COL, all);
    return NextResponse.json({ data: all[idx] });
  } catch (e) {
    console.error("[perguntas PUT]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;
    const all = readCollection<Pergunta>(COL);
    const idx = all.findIndex((x) => x.id === id && x.nutricionistaId === auth.nutricionistaId && !x.deletedAt);
    if (idx === -1) return NextResponse.json({ error: "Pergunta não encontrada" }, { status: 404 });
    if (all[idx].padrao) return NextResponse.json({ error: "Perguntas padrão não podem ser excluídas" }, { status: 403 });
    all[idx] = { ...all[idx], deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    writeCollection(COL, all);
    return NextResponse.json({ message: "Pergunta removida" });
  } catch (e) {
    console.error("[perguntas DELETE]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

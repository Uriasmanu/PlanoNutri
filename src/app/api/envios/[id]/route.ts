import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/db";
import { getAuth } from "@/lib/auth-helpers";
import type { Envio } from "@/types";

const ENVIO_COL = "envios";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;

    const all = readCollection<Envio>(ENVIO_COL);
    const idx = all.findIndex((e) => e.id === id && e.nutricionistaId === auth.nutricionistaId);
    if (idx === -1) return NextResponse.json({ error: "Agendamento não encontrado" }, { status: 404 });

    all[idx] = { ...all[idx], status: "cancelado", updatedAt: new Date().toISOString() };
    writeCollection(ENVIO_COL, all);

    return NextResponse.json({ data: all[idx] });
  } catch (e) {
    console.error("[envios DELETE]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/db";
import { getAuth } from "@/lib/auth-helpers";
import { pacienteSchema } from "@/lib/validations/paciente";
import type { Paciente } from "@/types";

const COLLECTION = "pacientes";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;

    const all = readCollection<Paciente>(COLLECTION);
    const paciente = all.find((p) => p.id === id && p.nutricionistaId === auth.nutricionistaId && !p.deletedAt);
    if (!paciente) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });

    return NextResponse.json({ data: paciente });
  } catch (e) {
    console.error("[pacientes GET id]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;

    const all = readCollection<Paciente>(COLLECTION);
    const idx = all.findIndex((p) => p.id === id && p.nutricionistaId === auth.nutricionistaId && !p.deletedAt);
    if (idx === -1) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });

    const body = await request.json();
    // allow partial update but validate merged object
    const merged = { ...all[idx], ...body };
    // For validation we need to pick only schema fields
    const parsed = pacienteSchema.safeParse(merged);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const updated: Paciente = {
      ...all[idx],
      nomeCompleto: data.nomeCompleto,
      dataNascimento: data.dataNascimento,
      sexo: data.sexo,
      telefone: data.telefone,
      email: data.email,
      pesoInicial: data.pesoInicial,
      altura: data.altura,
      percentualGordura: data.percentualGordura ?? null,
      circunferenciaCintura: data.circunferenciaCintura ?? null,
      circunferenciaQuadril: data.circunferenciaQuadril ?? null,
      circunferenciaBraco: data.circunferenciaBraco ?? null,
      objetivo: data.objetivo,
      restricoesAlimentares: data.restricoesAlimentares || "",
      historicoClinico: data.historicoClinico || "",
      nivelAtividadeFisica: data.nivelAtividadeFisica,
      observacoes: data.observacoes ?? null,
      status: data.status,
      updatedAt: new Date().toISOString(),
    };

    all[idx] = updated;
    writeCollection(COLLECTION, all);
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error("[pacientes PUT]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;

    const all = readCollection<Paciente>(COLLECTION);
    const idx = all.findIndex((p) => p.id === id && p.nutricionistaId === auth.nutricionistaId && !p.deletedAt);
    if (idx === -1) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });

    all[idx] = { ...all[idx], deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    writeCollection(COLLECTION, all);
    return NextResponse.json({ message: "Paciente removido com sucesso" });
  } catch (e) {
    console.error("[pacientes DELETE]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

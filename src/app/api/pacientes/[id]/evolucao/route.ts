import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/db";
import { getAuth } from "@/lib/auth-helpers";
import { evolucaoSchema } from "@/lib/validations/paciente";
import type { Paciente, EvolucaoFisica } from "@/types";

const PACIENTE_COL = "pacientes";
const EVOLUCAO_COL = "evolucao_fisica";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;

    const pacientes = readCollection<Paciente>(PACIENTE_COL);
    const paciente = pacientes.find((p) => p.id === id && p.nutricionistaId === auth.nutricionistaId && !p.deletedAt);
    if (!paciente) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });

    const evolucoes = readCollection<EvolucaoFisica>(EVOLUCAO_COL)
      .filter((e) => e.pacienteId === id)
      .sort((a, b) => new Date(a.dataAvaliacao).getTime() - new Date(b.dataAvaliacao).getTime());

    return NextResponse.json({ data: evolucoes });
  } catch (e) {
    console.error("[evolucao GET]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;

    const pacientes = readCollection<Paciente>(PACIENTE_COL);
    const paciente = pacientes.find((p) => p.id === id && p.nutricionistaId === auth.nutricionistaId && !p.deletedAt);
    if (!paciente) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });

    const body = await request.json();
    const parsed = evolucaoSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const now = new Date().toISOString();
    const evolucao: EvolucaoFisica = {
      id: crypto.randomUUID(),
      pacienteId: id,
      dataAvaliacao: new Date(data.dataAvaliacao).toISOString(),
      peso: data.peso,
      percentualGordura: data.percentualGordura ?? null,
      circunferenciaCintura: data.circunferenciaCintura ?? null,
      circunferenciaQuadril: data.circunferenciaQuadril ?? null,
      circunferenciaBraco: data.circunferenciaBraco ?? null,
      observacoes: data.observacoes ?? null,
      createdAt: now,
    };

    const all = readCollection<EvolucaoFisica>(EVOLUCAO_COL);
    all.push(evolucao);
    writeCollection(EVOLUCAO_COL, all);

    return NextResponse.json({ data: evolucao }, { status: 201 });
  } catch (e) {
    console.error("[evolucao POST]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

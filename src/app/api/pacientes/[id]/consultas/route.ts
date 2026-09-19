import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/db";
import { getAuth } from "@/lib/auth-helpers";
import { consultaSchema } from "@/lib/validations/consulta";
import type { Paciente, Consulta } from "@/types";

const PACIENTE_COL = "pacientes";
const CONSULTA_COL = "consultas";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    const { id } = await params;

    const pacientes = readCollection<Paciente>(PACIENTE_COL);
    const paciente = pacientes.find((p) => p.id === id && p.nutricionistaId === auth.nutricionistaId && !p.deletedAt);
    if (!paciente) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });

    const consultas = readCollection<Consulta>(CONSULTA_COL)
      .filter((c) => c.pacienteId === id && !c.deletedAt)
      .sort((a, b) => new Date(b.dataConsulta).getTime() - new Date(a.dataConsulta).getTime());

    return NextResponse.json({ data: consultas });
  } catch (e) {
    console.error("[consultas GET]", e);
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
    const parsed = consultaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const now = new Date().toISOString();
    const consulta: Consulta = {
      id: crypto.randomUUID(),
      nutricionistaId: auth.nutricionistaId,
      pacienteId: id,
      dataConsulta: new Date(data.dataConsulta).toISOString(),
      tipo: data.tipo,
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const all = readCollection<Consulta>(CONSULTA_COL);
    all.push(consulta);
    writeCollection(CONSULTA_COL, all);

    return NextResponse.json({ data: consulta }, { status: 201 });
  } catch (e) {
    console.error("[consultas POST]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

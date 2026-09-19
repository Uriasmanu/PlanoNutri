import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/db";
import { getAuth } from "@/lib/auth-helpers";
import { consultaSchema } from "@/lib/validations/consulta";
import type { Paciente, Consulta } from "@/types";

const PACIENTE_COL = "pacientes";
const CONSULTA_COL = "consultas";

async function findConsultaOwnedByAuth(request: NextRequest, pacienteId: string, consultaId: string) {
  const auth = await getAuth(request);
  if (!auth) return { error: NextResponse.json({ error: "Não autenticado" }, { status: 401 }) } as const;

  const pacientes = readCollection<Paciente>(PACIENTE_COL);
  const paciente = pacientes.find((p) => p.id === pacienteId && p.nutricionistaId === auth.nutricionistaId && !p.deletedAt);
  if (!paciente) return { error: NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 }) } as const;

  const all = readCollection<Consulta>(CONSULTA_COL);
  const idx = all.findIndex((c) => c.id === consultaId && c.pacienteId === pacienteId && !c.deletedAt);
  if (idx === -1) return { error: NextResponse.json({ error: "Consulta não encontrada" }, { status: 404 }) } as const;

  return { all, idx } as const;
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string; consultaId: string }> }) {
  try {
    const { id, consultaId } = await params;
    const result = await findConsultaOwnedByAuth(request, id, consultaId);
    if ("error" in result) return result.error;

    const body = await request.json();
    const parsed = consultaSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const { all, idx } = result;
    const updated: Consulta = {
      ...all[idx],
      dataConsulta: new Date(parsed.data.dataConsulta).toISOString(),
      tipo: parsed.data.tipo,
      updatedAt: new Date().toISOString(),
    };
    all[idx] = updated;
    writeCollection(CONSULTA_COL, all);

    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error("[consultas PUT]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string; consultaId: string }> }) {
  try {
    const { id, consultaId } = await params;
    const result = await findConsultaOwnedByAuth(request, id, consultaId);
    if ("error" in result) return result.error;

    const { all, idx } = result;
    all[idx] = { ...all[idx], deletedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
    writeCollection(CONSULTA_COL, all);

    return NextResponse.json({ message: "Consulta removida com sucesso" });
  } catch (e) {
    console.error("[consultas DELETE]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

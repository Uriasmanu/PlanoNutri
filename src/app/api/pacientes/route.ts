import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/db";
import { getAuth } from "@/lib/auth-helpers";
import { pacienteSchema } from "@/lib/validations/paciente";
import type { Paciente } from "@/types";

const COLLECTION = "pacientes";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || undefined;
    const status = searchParams.get("status") || "ativo"; // default ativo
    const page = Number(searchParams.get("page") || "1");
    const pageSize = Math.min(Number(searchParams.get("pageSize") || "10"), 50);

    const all = readCollection<Paciente>(COLLECTION).filter(
      (p) => p.nutricionistaId === auth.nutricionistaId && !p.deletedAt
    );

    let filtered = all;

    // status filter: "todos" = no filter, otherwise exact
    if (status && status !== "todos") {
      filtered = filtered.filter((p) => p.status === status);
    }

    if (q) {
      const qq = q.toLowerCase().trim();
      filtered = filtered.filter(
        (p) => p.nomeCompleto.toLowerCase().includes(qq) || p.email.toLowerCase().includes(qq)
      );
    }

    // sort by createdAt desc (newest first)
    filtered = filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const safePage = Math.min(Math.max(1, page), totalPages);
    const start = (safePage - 1) * pageSize;
    const data = filtered.slice(start, start + pageSize);

    return NextResponse.json({ data, total, page: safePage, pageSize, totalPages });
  } catch (e) {
    console.error("[pacientes GET]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const body = await request.json();
    const parsed = pacienteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
    }

    const data = parsed.data;
    const now = new Date().toISOString();
    const paciente: Paciente = {
      id: crypto.randomUUID(),
      nutricionistaId: auth.nutricionistaId,
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
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    };

    const all = readCollection<Paciente>(COLLECTION);
    all.push(paciente);
    writeCollection(COLLECTION, all);

    return NextResponse.json({ data: paciente }, { status: 201 });
  } catch (e) {
    console.error("[pacientes POST]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

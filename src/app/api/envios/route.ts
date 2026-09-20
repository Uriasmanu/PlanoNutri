import { NextRequest, NextResponse } from "next/server";
import { readCollection, writeCollection } from "@/lib/db";
import { getAuth } from "@/lib/auth-helpers";
import { envioSchema } from "@/lib/validations/envio";
import { getUltimaConsulta, calcularDataEnvioPrevista, type EnvioEnriquecido } from "@/lib/envios";
import type { Paciente, Questionario, Envio } from "@/types";

const ENVIO_COL = "envios";
const PACIENTE_COL = "pacientes";
const QUESTIONARIO_COL = "questionarios";

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const pacienteId = searchParams.get("pacienteId") || undefined;
    const status = searchParams.get("status") || "agendado";

    let envios = readCollection<Envio>(ENVIO_COL).filter((e) => e.nutricionistaId === auth.nutricionistaId);
    if (pacienteId) envios = envios.filter((e) => e.pacienteId === pacienteId);
    if (status !== "todos") envios = envios.filter((e) => e.status === status);

    envios = envios.sort((a, b) => new Date(a.dataEnvioPrevista).getTime() - new Date(b.dataEnvioPrevista).getTime());

    const pacientes = readCollection<Paciente>(PACIENTE_COL);
    const questionarios = readCollection<Questionario>(QUESTIONARIO_COL);

    const enriched: EnvioEnriquecido[] = envios.map((e) => ({
      ...e,
      pacienteNome: pacientes.find((p) => p.id === e.pacienteId)?.nomeCompleto ?? "—",
      questionarioTitulo: questionarios.find((q) => q.id === e.questionarioId)?.titulo ?? "—",
    }));

    return NextResponse.json({ data: enriched });
  } catch (e) {
    console.error("[envios GET]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuth(request);
    if (!auth) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    const body = await request.json();
    const parsed = envioSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Dados inválidos", details: parsed.error.flatten() }, { status: 400 });
    }
    const data = parsed.data;

    const pacientes = readCollection<Paciente>(PACIENTE_COL);
    const paciente = pacientes.find((p) => p.id === data.pacienteId && p.nutricionistaId === auth.nutricionistaId && !p.deletedAt);
    if (!paciente) return NextResponse.json({ error: "Paciente não encontrado" }, { status: 404 });
    if (paciente.status !== "ativo") {
      return NextResponse.json({ error: "Só é possível agendar envio para paciente ativo" }, { status: 400 });
    }

    const questionarios = readCollection<Questionario>(QUESTIONARIO_COL);
    const questionario = questionarios.find((q) => q.id === data.questionarioId && q.nutricionistaId === auth.nutricionistaId && !q.deletedAt);
    if (!questionario) return NextResponse.json({ error: "Questionário não encontrado" }, { status: 404 });
    if (questionario.status !== "ativo") {
      return NextResponse.json({ error: "Só é possível agendar um questionário ativo" }, { status: 400 });
    }

    let ultimaConsulta = null;
    if (data.tipoAgendamento === "relativo" && data.referencia === "ultima_consulta") {
      ultimaConsulta = getUltimaConsulta(paciente.id);
      if (!ultimaConsulta) {
        return NextResponse.json({ error: "Paciente não possui nenhuma consulta registrada para usar como referência" }, { status: 400 });
      }
    }

    const dataEnvioPrevista = calcularDataEnvioPrevista({
      tipoAgendamento: data.tipoAgendamento,
      referencia: data.referencia,
      dias: data.dias,
      data: data.data,
      pacienteCreatedAt: paciente.createdAt,
      ultimaConsulta,
    });

    const configuracaoAgendamento =
      data.tipoAgendamento === "relativo" ? { referencia: data.referencia, dias: data.dias } : { data: data.data };

    const now = new Date().toISOString();
    const envio: Envio = {
      id: crypto.randomUUID(),
      nutricionistaId: auth.nutricionistaId,
      pacienteId: paciente.id,
      questionarioId: questionario.id,
      canal: data.canal,
      tipoAgendamento: data.tipoAgendamento,
      configuracaoAgendamento,
      dataEnvioPrevista,
      status: "agendado",
      createdAt: now,
      updatedAt: now,
    };

    const all = readCollection<Envio>(ENVIO_COL);
    all.push(envio);
    writeCollection(ENVIO_COL, all);

    return NextResponse.json({ data: envio }, { status: 201 });
  } catch (e) {
    console.error("[envios POST]", e);
    return NextResponse.json({ error: "Erro interno" }, { status: 500 });
  }
}

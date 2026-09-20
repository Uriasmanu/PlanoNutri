# Agendamento de Envio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the nutritionist schedule when a questionnaire should be sent to a patient (relative to registration or last consultation, or a fixed date) and see/cancel those schedules — with zero actual dispatch, link generation, or response handling (deferred to the last cycle of the roadmap per DR-013/DR-014).

**Architecture:** Same layered Next.js pattern as every prior feature — file-based JSON collection (`src/data/envios.json`), Zod validation, React Hook Form UI. Two new pure helper functions (`getUltimaConsulta`, `calcularDataEnvioPrevista`) compute the schedule date; a status ("atrasado") is derived at display time, never persisted, so no scheduler/cron infrastructure is needed.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Zod, React Hook Form, date-fns, Tailwind, existing `src/components/ui` primitives.

**Spec:** `feature/agendamento-envio.md`

## Global Constraints

- No automated test framework exists in this repo. Validation is `npm run build` (TypeScript compiles clean) + manual verification against each acceptance criterion — same convention as every prior cycle.
- camelCase everywhere; soft delete pattern (`deletedAt`) is **not** used for `Envio` — cancelling sets `status: "cancelado"` and keeps the record (see spec §1, "sem soft delete").
- Every record scoped to a patient/schedule must carry `nutricionistaId`, and every read/write must filter by it (DR-002, DR-008).
- API response contract: success as `{ data: ... }`, error as `{ error: string }`, exactly like every existing route.
- **Nothing in this plan may call an external service, generate a token/link, or create a `Resposta`/`RespostaItem` record.** That is explicitly out of scope (DR-013) until the final "disparo efetivo" cycle.
- When writing a schema with `.superRefine()`, never call `.partial()` on it — that combination crashed the build once already (fixed in commit `26998d1`) because `ZodEffects` has no `.partial()` method.
- Required breakpoints to manually check for any new UI: 375px, 768px, 1440px.

---

### Task 1: Types and validation schema

**Files:**
- Modify: `src/types/index.ts` (replace the `CanalEnvio`/`TipoAgendamento`/`StatusEnvio`/`Envio` block; leave `Resposta`/`RespostaItem` untouched)
- Create: `src/lib/validations/envio.ts`

**Interfaces:**
- Produces: `CanalEnvio`, `TipoAgendamento` (`"relativo" | "data_fixa"`), `ReferenciaRelativa` (`"cadastro" | "ultima_consulta"`), `StatusEnvio` (`"agendado" | "cancelado"`), `Envio` interface, `envioSchema` (Zod), `EnvioFormData` type — used by every later task.

- [ ] **Step 1: Replace the Envio-related types**

In `src/types/index.ts`, replace this block (currently lines 120–153):

```ts
export type CanalEnvio =
  | "email"
  | "whatsapp_manual"
  | "whatsapp_api"
  | "qrcode"
  | "sms";

export type TipoAgendamento = "relativo" | "data_fixa" | "recorrencia";

export type StatusEnvio =
  | "agendado"
  | "pendente_envio"
  | "enviado"
  | "respondido"
  | "atrasado"
  | "cancelado";

export interface Envio {
  id: string;
  nutricionistaId: string;
  pacienteId: string;
  questionarioId: string;
  canal: CanalEnvio;
  tipoAgendamento: TipoAgendamento;
  configuracaoAgendamento: Record<string, unknown>;
  dataEnvioPrevista: string;
  dataEnvioEfetiva: string | null;
  status: StatusEnvio;
  token: string | null;
  respondidoEm: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
```

with:

```ts
export type CanalEnvio =
  | "email"
  | "whatsapp_manual"
  | "whatsapp_api"
  | "qrcode"
  | "sms";

export type TipoAgendamento = "relativo" | "data_fixa";

export type ReferenciaRelativa = "cadastro" | "ultima_consulta";

export type StatusEnvio = "agendado" | "cancelado";

export interface Envio {
  id: string;
  nutricionistaId: string;
  pacienteId: string;
  questionarioId: string;
  canal: CanalEnvio;
  tipoAgendamento: TipoAgendamento;
  configuracaoAgendamento: Record<string, unknown>;
  dataEnvioPrevista: string;
  status: StatusEnvio;
  createdAt: string;
  updatedAt: string;
}
```

Leave `Resposta` and `RespostaItem` (below it in the file) exactly as they are.

- [ ] **Step 2: Create the validation schema**

Create `src/lib/validations/envio.ts`:

```ts
import { z } from "zod";

const canalEnum = z.enum(["email", "whatsapp_manual", "whatsapp_api", "qrcode", "sms"], {
  required_error: "Canal é obrigatório",
});
const tipoAgendamentoEnum = z.enum(["relativo", "data_fixa"], {
  required_error: "Tipo de agendamento é obrigatório",
});
const referenciaEnum = z.enum(["cadastro", "ultima_consulta"]);

export const envioSchema = z
  .object({
    pacienteId: z.string().uuid("Paciente inválido"),
    questionarioId: z.string().uuid("Questionário inválido"),
    canal: canalEnum,
    tipoAgendamento: tipoAgendamentoEnum,
    referencia: referenciaEnum.optional(),
    dias: z.preprocess(
      (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
      z.number().int("Deve ser um número inteiro").min(1, "Mínimo 1 dia").max(365, "Máximo 365 dias").optional()
    ),
    data: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipoAgendamento === "relativo") {
      if (!data.referencia) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["referencia"], message: "Referência é obrigatória" });
      }
      if (data.dias === undefined) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["dias"], message: "Quantidade de dias é obrigatória" });
      }
    }
    if (data.tipoAgendamento === "data_fixa") {
      if (!data.data || isNaN(Date.parse(data.data))) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["data"], message: "Data é obrigatória e deve ser válida" });
      }
    }
  });

export type EnvioFormData = z.infer<typeof envioSchema>;
```

Note: unlike `perguntaUpdateSchema` (removed in `26998d1`), nothing here calls `.partial()` on `envioSchema` — there is no edit endpoint for `Envio` in this cycle (only create + cancel), so the crash pattern cannot recur.

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: build succeeds. (Nothing consumes the new/changed types yet in this step, but nothing else in the codebase references the removed `Envio` fields either — `Resposta`/`RespostaItem` are untouched and unused elsewhere.)

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/lib/validations/envio.ts
git commit -m "feat(envios): add simplified Envio types and validation schema"
```

---

### Task 2: Scheduling helpers

**Files:**
- Create: `src/lib/envios.ts`

**Interfaces:**
- Consumes: `readCollection` (`@/lib/db`), `Consulta`/`Envio` types (Task 1 + existing).
- Produces: `getUltimaConsulta(pacienteId: string): Consulta | null`, `calcularDataEnvioPrevista(params): string`, `EnvioEnriquecido` interface (`Envio & { pacienteNome: string; questionarioTitulo: string }`) — consumed by Tasks 3, 6, 7, 8, 9.

- [ ] **Step 1: Write the helpers**

Create `src/lib/envios.ts`:

```ts
import { addDays } from "date-fns";
import { readCollection } from "@/lib/db";
import type { Consulta, Envio, TipoAgendamento, ReferenciaRelativa } from "@/types";

export function getUltimaConsulta(pacienteId: string): Consulta | null {
  const consultas = readCollection<Consulta>("consultas")
    .filter((c) => c.pacienteId === pacienteId && !c.deletedAt)
    .sort((a, b) => new Date(b.dataConsulta).getTime() - new Date(a.dataConsulta).getTime());
  return consultas[0] ?? null;
}

export function calcularDataEnvioPrevista(params: {
  tipoAgendamento: TipoAgendamento;
  referencia?: ReferenciaRelativa;
  dias?: number;
  data?: string;
  pacienteCreatedAt: string;
  ultimaConsulta: Consulta | null;
}): string {
  if (params.tipoAgendamento === "data_fixa") {
    return new Date(params.data as string).toISOString();
  }
  const base =
    params.referencia === "ultima_consulta" && params.ultimaConsulta
      ? new Date(params.ultimaConsulta.dataConsulta)
      : new Date(params.pacienteCreatedAt);
  return addDays(base, params.dias as number).toISOString();
}

export interface EnvioEnriquecido extends Envio {
  pacienteNome: string;
  questionarioTitulo: string;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds with no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/lib/envios.ts
git commit -m "feat(envios): add scheduling date helpers"
```

---

### Task 3: Backend — list and create schedules

**Files:**
- Create: `src/app/api/envios/route.ts`

**Interfaces:**
- Consumes: `getAuth`, `readCollection`/`writeCollection`, `envioSchema` (Task 1), `getUltimaConsulta`/`calcularDataEnvioPrevista`/`EnvioEnriquecido` (Task 2), `Paciente`/`Questionario`/`Envio` types.
- Produces: `GET /api/envios?pacienteId=&status=` → `{ data: EnvioEnriquecido[] }` (default `status=agendado`, sorted by `dataEnvioPrevista` ascending); `POST /api/envios` → `{ data: Envio }` (201) — consumed by Tasks 6–9.

- [ ] **Step 1: Write the route**

Create `src/app/api/envios/route.ts`:

```ts
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds with no new errors.

- [ ] **Step 3: Verify behavior manually**

Run: `npm run dev`, sign in through the browser at `/login`, create (or reuse) an active patient and an active questionário through the existing UI, and copy their ids from the URL/network tab. Open the browser DevTools console on that tab (so the `accessToken` cookie is sent automatically) and run, substituting the real ids:

```js
const pid = "<paciente id>";
const qid = "<questionario id>";
await fetch("/api/envios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pacienteId: pid, questionarioId: qid, canal: "email", tipoAgendamento: "relativo", referencia: "cadastro", dias: 7 }) }).then(r => r.json());
await fetch("/api/envios?status=todos").then(r => r.json());
```

Expected: the `POST` returns `{ data: { ..., tipoAgendamento: "relativo", status: "agendado", dataEnvioPrevista: "<paciente.createdAt + 7 dias>" } }` with status 201; the `GET` returns that same schedule enriched with `pacienteNome`/`questionarioTitulo`. Also verify: `tipoAgendamento: "relativo", referencia: "ultima_consulta"` for a patient with **no** consultations returns `{ error: "Paciente não possui nenhuma consulta registrada..." }` with status 400.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/envios/route.ts
git commit -m "feat(envios): add list/create API route"
```

---

### Task 4: Backend — cancel a schedule

**Files:**
- Create: `src/app/api/envios/[id]/route.ts`

**Interfaces:**
- Consumes: same as Task 3.
- Produces: `DELETE /api/envios/:id` → `{ data: Envio }` with `status: "cancelado"` — consumed by Tasks 7–9.

- [ ] **Step 1: Write the route**

Create `src/app/api/envios/[id]/route.ts`:

```ts
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Verify behavior manually**

With the dev server running and logged in (same browser tab as Task 3), in the console:

```js
const created = await fetch("/api/envios", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pacienteId: pid, questionarioId: qid, canal: "email", tipoAgendamento: "data_fixa", data: "2026-12-01" }) }).then(r => r.json());
await fetch(`/api/envios/${created.data.id}`, { method: "DELETE" }).then(r => r.json());
await fetch("/api/envios?status=agendado").then(r => r.json()); // should not include it
await fetch("/api/envios?status=cancelado").then(r => r.json()); // should include it
```

Expected: `DELETE` returns the schedule with `status: "cancelado"`; it disappears from the default (`agendado`) listing and appears under `status=cancelado`.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/envios/[id]/route.ts"
git commit -m "feat(envios): add cancel API route"
```

---

### Task 5: Cascade-cancel schedules when a patient becomes inactive

**Files:**
- Modify: `src/app/api/pacientes/[id]/route.ts`

**Interfaces:**
- Consumes: `Envio` type (Task 1), `readCollection`/`writeCollection` (already imported in this file).
- Produces: side effect only — no new exported interface.

- [ ] **Step 1: Add the import**

Change:

```ts
import type { Paciente } from "@/types";
```

to:

```ts
import type { Paciente, Envio } from "@/types";
```

- [ ] **Step 2: Add the cascade-cancel logic**

In the `PUT` handler, change:

```ts
    all[idx] = updated;
    writeCollection(COLLECTION, all);
    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error("[pacientes PUT]", e);
```

to:

```ts
    all[idx] = updated;
    writeCollection(COLLECTION, all);

    if (updated.status === "inativo") {
      const envios = readCollection<Envio>("envios");
      const cancelados = envios.map((e) =>
        e.pacienteId === updated.id && e.status === "agendado"
          ? { ...e, status: "cancelado" as const, updatedAt: new Date().toISOString() }
          : e
      );
      writeCollection("envios", cancelados);
    }

    return NextResponse.json({ data: updated });
  } catch (e) {
    console.error("[pacientes PUT]", e);
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 4: Verify behavior manually**

In the same browser console session, using `pid` from Task 3 (make sure it currently has at least one `agendado` schedule — repeat the `POST /api/envios` call from Task 3 if needed):

```js
await fetch(`/api/pacientes/${pid}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status: "inativo" }) }).then(r => r.json());
await fetch(`/api/envios?pacienteId=${pid}&status=agendado`).then(r => r.json()); // should be []
await fetch(`/api/envios?pacienteId=${pid}&status=cancelado`).then(r => r.json()); // should include the schedule(s)
```

Expected: after the patient goes `inativo`, its `agendado` schedules all show up as `cancelado` and none remain `agendado`. Afterwards, set the patient back to `ativo` (`PUT` with `{"status": "ativo"}`) so later tasks' manual checks aren't blocked by an inactive test patient.

- [ ] **Step 5: Commit**

```bash
git add "src/app/api/pacientes/[id]/route.ts"
git commit -m "feat(envios): cancel scheduled envios when patient becomes inactive"
```

---

### Task 6: `EnvioForm` component

**Files:**
- Create: `src/components/envios/EnvioForm.tsx`

**Interfaces:**
- Consumes: `envioSchema`/`EnvioFormData` (Task 1), `Button`/`Input`/`Label`/`Select` (existing), `Paciente`/`Questionario` types.
- Produces: `EnvioForm({ defaultPacienteId?: string, onSubmit: (data: EnvioFormData) => Promise<void>, isSubmitting?: boolean })` — consumed by Task 8.

- [ ] **Step 1: Write the component**

Create `src/components/envios/EnvioForm.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { envioSchema, type EnvioFormData } from "@/lib/validations/envio";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { Paciente, Questionario } from "@/types";

interface Props {
  defaultPacienteId?: string;
  onSubmit: (data: EnvioFormData) => Promise<void>;
  isSubmitting?: boolean;
}

export function EnvioForm({ defaultPacienteId, onSubmit, isSubmitting }: Props) {
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [questionarios, setQuestionarios] = useState<Questionario[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<EnvioFormData>({
    resolver: zodResolver(envioSchema),
    defaultValues: {
      pacienteId: defaultPacienteId || "",
      canal: "email",
      tipoAgendamento: "relativo",
      referencia: "cadastro",
    },
  });

  const tipoAgendamento = watch("tipoAgendamento");

  useEffect(() => {
    async function load() {
      const [pRes, qRes] = await Promise.all([
        fetch("/api/pacientes?status=ativo&pageSize=50"),
        fetch("/api/questionarios?status=ativo&pageSize=50"),
      ]);
      const pJson = await pRes.json();
      const qJson = await qRes.json();
      if (pRes.ok) setPacientes(pJson.data);
      if (qRes.ok) setQuestionarios(qJson.data);
      setLoadingOptions(false);
    }
    load();
  }, []);

  if (loadingOptions) {
    return <p className="text-sm text-muted-foreground">Carregando...</p>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 rounded-lg border p-4 bg-card">
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pacienteId">Paciente *</Label>
          <Select id="pacienteId" {...register("pacienteId")}>
            <option value="">Selecione...</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nomeCompleto}
              </option>
            ))}
          </Select>
          {errors.pacienteId && <p role="alert" className="text-xs text-destructive">{errors.pacienteId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="questionarioId">Questionário *</Label>
          <Select id="questionarioId" {...register("questionarioId")}>
            <option value="">Selecione...</option>
            {questionarios.map((q) => (
              <option key={q.id} value={q.id}>
                {q.titulo}
              </option>
            ))}
          </Select>
          {errors.questionarioId && <p role="alert" className="text-xs text-destructive">{errors.questionarioId.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="canal">Canal pretendido *</Label>
          <Select id="canal" {...register("canal")}>
            <option value="email">E-mail</option>
            <option value="whatsapp_manual">WhatsApp (manual)</option>
            <option value="whatsapp_api">WhatsApp (API)</option>
            <option value="qrcode">QR Code</option>
            <option value="sms">SMS</option>
          </Select>
          {errors.canal && <p role="alert" className="text-xs text-destructive">{errors.canal.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipoAgendamento">Tipo de agendamento *</Label>
          <Select id="tipoAgendamento" {...register("tipoAgendamento")}>
            <option value="relativo">Prazo relativo</option>
            <option value="data_fixa">Data fixa</option>
          </Select>
          {errors.tipoAgendamento && <p role="alert" className="text-xs text-destructive">{errors.tipoAgendamento.message}</p>}
        </div>

        {tipoAgendamento === "relativo" && (
          <>
            <div className="space-y-2">
              <Label htmlFor="referencia">Referência *</Label>
              <Select id="referencia" {...register("referencia")}>
                <option value="cadastro">Data de cadastro</option>
                <option value="ultima_consulta">Última consulta</option>
              </Select>
              {errors.referencia && <p role="alert" className="text-xs text-destructive">{errors.referencia.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="dias">Dias *</Label>
              <Input id="dias" type="number" min={1} max={365} {...register("dias")} />
              {errors.dias && <p role="alert" className="text-xs text-destructive">{(errors.dias.message as string)}</p>}
            </div>
          </>
        )}

        {tipoAgendamento === "data_fixa" && (
          <div className="space-y-2">
            <Label htmlFor="data">Data *</Label>
            <Input id="data" type="date" {...register("data")} />
            {errors.data && <p role="alert" className="text-xs text-destructive">{errors.data.message}</p>}
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : "Agendar envio"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds. (Not wired into a page yet — full interactive behavior is verified in Task 8.)

- [ ] **Step 3: Commit**

```bash
git add src/components/envios/EnvioForm.tsx
git commit -m "feat(envios): add EnvioForm component"
```

---

### Task 7: `EnvioList` component

**Files:**
- Create: `src/components/envios/EnvioList.tsx`

**Interfaces:**
- Consumes: `EnvioEnriquecido` (Task 2), `formatDate` (`@/lib/formatters`), `Button` (existing).
- Produces: `EnvioList({ envios: EnvioEnriquecido[], showPaciente?: boolean, onCancel: (envio: EnvioEnriquecido) => void })` — consumed by Tasks 8 and 9.

- [ ] **Step 1: Write the component**

Create `src/components/envios/EnvioList.tsx`:

```tsx
"use client";

import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";
import type { EnvioEnriquecido } from "@/lib/envios";

const TIPO_LABEL: Record<string, string> = {
  relativo: "Prazo relativo",
  data_fixa: "Data fixa",
};

const CANAL_LABEL: Record<string, string> = {
  email: "E-mail",
  whatsapp_manual: "WhatsApp (manual)",
  whatsapp_api: "WhatsApp (API)",
  qrcode: "QR Code",
  sms: "SMS",
};

interface Props {
  envios: EnvioEnriquecido[];
  showPaciente?: boolean;
  onCancel: (envio: EnvioEnriquecido) => void;
}

export function EnvioList({ envios, showPaciente = true, onCancel }: Props) {
  if (envios.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">Nenhum agendamento encontrado.</p>;
  }

  return (
    <div className="space-y-2">
      {envios.map((e) => {
        const atrasado = e.status === "agendado" && new Date(e.dataEnvioPrevista) < new Date();
        return (
          <div key={e.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border p-3 text-sm">
            <div className="space-y-0.5">
              {showPaciente && <div className="font-medium">{e.pacienteNome}</div>}
              <div className="text-muted-foreground">
                {e.questionarioTitulo} • {TIPO_LABEL[e.tipoAgendamento]} • {CANAL_LABEL[e.canal]}
              </div>
              <div className="text-xs text-muted-foreground">
                Previsto: {formatDate(e.dataEnvioPrevista)}
                {" — "}
                {e.status === "cancelado" ? (
                  <span className="text-destructive">Cancelado</span>
                ) : atrasado ? (
                  <span className="text-destructive">Atrasado</span>
                ) : (
                  <span>Agendado</span>
                )}
              </div>
            </div>
            {e.status === "agendado" && (
              <Button variant="outline" size="sm" onClick={() => onCancel(e)} className="shrink-0 self-start sm:self-center">
                Cancelar
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds.

- [ ] **Step 3: Commit**

```bash
git add src/components/envios/EnvioList.tsx
git commit -m "feat(envios): add EnvioList component"
```

---

### Task 8: `/envios` and `/envios/novo` pages

**Files:**
- Create: `src/app/envios/page.tsx`
- Create: `src/app/envios/novo/page.tsx`

**Interfaces:**
- Consumes: `EnvioList` (Task 7), `EnvioForm` (Task 6), `EnvioEnriquecido`/`EnvioFormData` types, `ConfirmDeleteDialog` (`@/components/ui/confirm-delete-dialog`, already exists from the Consultas cycle), the two API routes (Tasks 3–4).
- Produces: two working pages — consumed by nothing else, but Task 9 links to `/envios/novo?pacienteId=...`.

- [ ] **Step 1: Write the listing page**

Create `src/app/envios/page.tsx`:

```tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { EnvioList } from "@/components/envios/EnvioList";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import type { EnvioEnriquecido } from "@/lib/envios";

export default function EnviosPage() {
  const [envios, setEnvios] = useState<EnvioEnriquecido[]>([]);
  const [status, setStatus] = useState("agendado");
  const [loading, setLoading] = useState(true);
  const [cancelTarget, setCancelTarget] = useState<EnvioEnriquecido | null>(null);
  const [cancelling, setCancelling] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/envios?status=${status}`);
    if (res.ok) {
      const json = await res.json();
      setEnvios(json.data);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleCancel() {
    if (!cancelTarget) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/envios/${cancelTarget.id}`, { method: "DELETE" });
      if (res.ok) await load();
      setCancelTarget(null);
    } finally {
      setCancelling(false);
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold tracking-tight">Envios</h1>
        <Button asChild size="sm">
          <Link href="/envios/novo">
            <Plus className="h-4 w-4 mr-1" /> Novo agendamento
          </Link>
        </Button>
      </div>

      <div className="max-w-[220px]">
        <Select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="agendado">Agendados</option>
          <option value="cancelado">Cancelados</option>
          <option value="todos">Todos</option>
        </Select>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : (
        <EnvioList envios={envios} onCancel={setCancelTarget} />
      )}

      <ConfirmDeleteDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelTarget(null)}
        title="Cancelar agendamento?"
        description="O agendamento será marcado como cancelado e sai da listagem padrão, mas continua no histórico."
        onConfirm={handleCancel}
        loading={cancelling}
      />
    </div>
  );
}
```

- [ ] **Step 2: Write the new-schedule page**

Create `src/app/envios/novo/page.tsx`. `useSearchParams()` must be inside a `<Suspense>` boundary in the Next.js App Router, otherwise the build fails — split the part that reads it into an inner component:

```tsx
"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EnvioForm } from "@/components/envios/EnvioForm";
import type { EnvioFormData } from "@/lib/validations/envio";

function NovoEnvioForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultPacienteId = searchParams.get("pacienteId") || undefined;
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(data: EnvioFormData) {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/envios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erro ao agendar envio");
      router.push("/envios");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao agendar");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <EnvioForm defaultPacienteId={defaultPacienteId} onSubmit={handleSubmit} isSubmitting={submitting} />
    </>
  );
}

export default function NovoEnvioPage() {
  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/envios">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Novo agendamento</h1>
      </div>

      <Suspense fallback={<p className="text-sm text-muted-foreground">Carregando...</p>}>
        <NovoEnvioForm />
      </Suspense>
    </div>
  );
}
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: build succeeds, and the route list includes `/envios` and `/envios/novo`.

- [ ] **Step 4: Verify every acceptance criterion manually**

Run: `npm run dev`, log in, and walk through:

- **CA-28/CA-31:** Go to `/envios/novo`, pick an active patient and questionário, choose "Prazo relativo" + "Data de cadastro" + 7 dias → after saving, the list at `/envios` shows the schedule with the expected date (patient's registration date + 7 days). Repeat with "Data fixa" and a specific date → the date shown matches exactly.
- **CA-29/CA-30:** Pick "Última consulta" as the reference for a patient that has a consultation registered (from the Histórico de Consultas feature) → date is registration-consultation-date + N days. For a patient with **no** consultations, the same choice shows a clear inline/error message and does not create the schedule.
- **CA-32:** Create a schedule with "Data fixa" set to a date in the past → it appears in the list labeled "Atrasado".
- **CA-33:** Click "Cancelar" on a schedule, confirm in the dialog → it disappears from the default (Agendados) filter and reappears when switching the filter to "Cancelados".
- **CA-35:** At 375px, 768px and 1440px, both `/envios` and `/envios/novo` have no horizontal scroll and every control stays usable.

- [ ] **Step 5: Commit**

```bash
git add src/app/envios/page.tsx "src/app/envios/novo/page.tsx"
git commit -m "feat(envios): add /envios listing and /envios/novo scheduling pages"
```

---

### Task 9: Wire schedules into the patient profile

**Files:**
- Modify: `src/app/pacientes/[id]/page.tsx`

**Interfaces:**
- Consumes: everything from Tasks 1–8 (`EnvioEnriquecido`, `EnvioList`, the two API routes, `ConfirmDeleteDialog`).
- Produces: the finished, user-facing feature — nothing later depends on this task.

- [ ] **Step 1: Update imports**

Change:

```tsx
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
```

to:

```tsx
import { ArrowLeft, Loader2, Pencil, Trash2, Plus } from "lucide-react";
```

Change:

```tsx
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { formatDate, calcIdade, getInitials } from "@/lib/formatters";
import type { Paciente, EvolucaoFisica, Consulta } from "@/types";
import type { EvolucaoFormData } from "@/lib/validations/paciente";
import type { ConsultaFormData } from "@/lib/validations/consulta";
```

to:

```tsx
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { EnvioList } from "@/components/envios/EnvioList";
import { formatDate, calcIdade, getInitials } from "@/lib/formatters";
import type { Paciente, EvolucaoFisica, Consulta } from "@/types";
import type { EvolucaoFormData } from "@/lib/validations/paciente";
import type { ConsultaFormData } from "@/lib/validations/consulta";
import type { EnvioEnriquecido } from "@/lib/envios";
```

- [ ] **Step 2: Add state and data loading**

Change:

```tsx
  const [deleteConsultaTarget, setDeleteConsultaTarget] = useState<Consulta | null>(null);
  const [deletingConsulta, setDeletingConsulta] = useState(false);
```

to:

```tsx
  const [deleteConsultaTarget, setDeleteConsultaTarget] = useState<Consulta | null>(null);
  const [deletingConsulta, setDeletingConsulta] = useState(false);
  const [envios, setEnvios] = useState<EnvioEnriquecido[]>([]);
  const [cancelEnvioTarget, setCancelEnvioTarget] = useState<EnvioEnriquecido | null>(null);
  const [cancellingEnvio, setCancellingEnvio] = useState(false);
```

Change:

```tsx
  async function loadConsultas() {
    const res = await fetch(`/api/pacientes/${params.id}/consultas`);
    if (res.ok) {
      const json = await res.json();
      setConsultas(json.data);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        await loadPaciente();
        await loadEvolucoes();
        await loadConsultas();
      } catch (e) {
```

to:

```tsx
  async function loadConsultas() {
    const res = await fetch(`/api/pacientes/${params.id}/consultas`);
    if (res.ok) {
      const json = await res.json();
      setConsultas(json.data);
    }
  }

  async function loadEnvios() {
    const res = await fetch(`/api/envios?pacienteId=${params.id}&status=todos`);
    if (res.ok) {
      const json = await res.json();
      setEnvios(json.data);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        await loadPaciente();
        await loadEvolucoes();
        await loadConsultas();
        await loadEnvios();
      } catch (e) {
```

- [ ] **Step 3: Add the cancel handler**

Immediately after the existing `handleDeleteConsulta` function (before `handleDelete`), add:

```tsx
  async function handleCancelEnvio() {
    if (!cancelEnvioTarget) return;
    setCancellingEnvio(true);
    try {
      const res = await fetch(`/api/envios/${cancelEnvioTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao cancelar agendamento");
      await loadEnvios();
      setCancelEnvioTarget(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao cancelar");
    } finally {
      setCancellingEnvio(false);
    }
  }
```

- [ ] **Step 4: Replace the "Questionários" tab placeholder**

Change:

```tsx
        <TabsContent value="questionarios" className="mt-4">
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-sm text-muted-foreground">Questionários vinculados aparecerão aqui quando o agendamento de envio for implementado.</p>
              <p className="text-xs text-muted-foreground mt-1">Agendamento e envio de questionários serão configurados no próximo ciclo do roadmap.</p>
            </CardContent>
          </Card>
        </TabsContent>
```

to:

```tsx
        <TabsContent value="questionarios" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Questionários agendados</h3>
            <Button size="sm" asChild>
              <Link href={`/envios/novo?pacienteId=${paciente.id}`}>
                <Plus className="h-4 w-4 mr-1" /> Agendar questionário
              </Link>
            </Button>
          </div>
          <Card>
            <CardContent className="p-4">
              <EnvioList envios={envios} showPaciente={false} onCancel={setCancelEnvioTarget} />
            </CardContent>
          </Card>
        </TabsContent>
```

- [ ] **Step 5: Add the cancel confirmation dialog**

Change:

```tsx
      <ConfirmDeleteDialog
        open={!!deleteConsultaTarget}
        onOpenChange={(open) => !open && setDeleteConsultaTarget(null)}
        title="Excluir consulta?"
        description="Tem certeza que deseja excluir esta consulta? Esta ação fará soft delete (a consulta não aparecerá mais na listagem, mas o histórico será preservado)."
        onConfirm={handleDeleteConsulta}
        loading={deletingConsulta}
      />
    </div>
  );
}
```

to:

```tsx
      <ConfirmDeleteDialog
        open={!!deleteConsultaTarget}
        onOpenChange={(open) => !open && setDeleteConsultaTarget(null)}
        title="Excluir consulta?"
        description="Tem certeza que deseja excluir esta consulta? Esta ação fará soft delete (a consulta não aparecerá mais na listagem, mas o histórico será preservado)."
        onConfirm={handleDeleteConsulta}
        loading={deletingConsulta}
      />

      <ConfirmDeleteDialog
        open={!!cancelEnvioTarget}
        onOpenChange={(open) => !open && setCancelEnvioTarget(null)}
        title="Cancelar agendamento?"
        description="O agendamento será marcado como cancelado e sai da listagem padrão, mas continua no histórico."
        onConfirm={handleCancelEnvio}
        loading={cancellingEnvio}
      />
    </div>
  );
}
```

- [ ] **Step 6: Verify it compiles**

Run: `npm run build`
Expected: build succeeds with no new errors.

- [ ] **Step 7: Verify manually**

Run: `npm run dev`, log in, open a patient's profile, go to the "Questionários" tab: confirm it lists that patient's schedules (created via `/envios/novo` in Task 8, or via the "Agendar questionário" button here), and that cancelling one from here updates the list without a full page reload. Re-check responsiveness at 375px/768px/1440px (CA-35) for this tab specifically.

- [ ] **Step 8: Commit**

```bash
git add "src/app/pacientes/[id]/page.tsx"
git commit -m "feat(envios): show scheduled questionnaires in patient profile"
```

---

## Self-Review Notes

- **Spec coverage:** RF-44 (Task 3), RF-45/RF-47 (Task 2 + 3), RF-46 (Task 3, blocked with 400), RF-48 (Tasks 3 + 7, "Atrasado" computed in `EnvioList`), RF-49 (Task 4), RF-50 (Task 5), RF-51 (Task 9). CA-28–CA-35 all exercised explicitly in Task 8 Step 4 and Task 9 Step 7. §5.2 reuse concerns (shared `EnvioList` via `showPaciente`, shared `calcularDataEnvioPrevista`/`getUltimaConsulta`) → Tasks 2, 7, 9.
- **Placeholder scan:** no TBD/TODO; every step has literal code or literal verification commands.
- **Type consistency:** `EnvioFormData` (Task 1) is exactly what `EnvioForm`'s `onSubmit` (Task 6) and the `/envios/novo` page's `handleSubmit` (Task 8) use; `EnvioEnriquecido` (Task 2) is what the `GET /api/envios` route returns (Task 3) and what `EnvioList` (Task 7), `/envios/page.tsx` (Task 8), and the patient profile's `envios` state (Task 9) all consume — one shape, defined once, used everywhere. `Envio.status` is `"agendado" | "cancelado"` everywhere (Task 1) — no code path ever sets or checks `"enviado"`/`"respondido"`/`"pendente_envio"`, matching DR-013's "no dispatch" boundary.

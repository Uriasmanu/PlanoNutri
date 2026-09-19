# Histórico de Consultas Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let the nutritionist record which consultations (date + type) already happened for a patient, so the app has a "last consultation" reference date, and see that history in the patient profile.

**Architecture:** Next.js App Router feature, file-based persistence (`src/lib/db.ts` + `src/data/consultas.json`), following the exact same layered pattern already used by "Evolução Física" (API route reads/writes the JSON collection directly, Zod schema validates input, React Hook Form drives the UI, patient profile page owns the page-level state).

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript, Zod, React Hook Form, Tailwind, shadcn-style UI primitives already in `src/components/ui`.

**Spec:** `feature/historico-consultas.md`

## Global Constraints

- No automated test framework exists in this repo (no Jest/Vitest, no `*.test.*` files, no test script in `package.json`). Validation follows the same convention already used for every prior cycle (v0.1–v0.3): `npm run build` (TypeScript compiles clean) + manual verification against each acceptance criterion. Do not introduce a test framework as part of this plan — it is out of the approved spec's scope.
- camelCase everywhere in types/fields (e.g. `dataConsulta`, not `data_consulta`).
- Soft delete only: `deletedAt: string | null`, never physical deletion.
- Every record scoped to a patient must carry `nutricionistaId` and every read/write must filter by `nutricionistaId === auth.nutricionistaId` and `!deletedAt` (DR-002, DR-008).
- API response contract: success as `{ data: ... }` (or `{ message: string }` for deletes), error as `{ error: string }`, exactly like `src/app/api/pacientes/[id]/evolucao/route.ts`.
- Required breakpoints to manually check for any new UI: 375px, 768px, 1440px (`doc/spec.md` §5.1).

---

### Task 1: Types and validation schema

**Files:**
- Modify: `src/types/index.ts` (insert after the `EvolucaoFisica` interface, before `TipoRespostaPergunta`)
- Create: `src/lib/validations/consulta.ts`

**Interfaces:**
- Produces: `TipoConsulta` (`"primeira_consulta" | "retorno"`), `Consulta` interface, `consultaSchema` (Zod), `ConsultaFormData` type — used by every later task.

- [ ] **Step 1: Add the `Consulta` type**

In `src/types/index.ts`, insert immediately after the closing `}` of the `EvolucaoFisica` interface:

```ts
export type TipoConsulta = "primeira_consulta" | "retorno";

export interface Consulta {
  id: string;
  nutricionistaId: string;
  pacienteId: string;
  dataConsulta: string;
  tipo: TipoConsulta;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
```

- [ ] **Step 2: Create the validation schema**

Create `src/lib/validations/consulta.ts`:

```ts
import { z } from "zod";

const tipoConsultaEnum = z.enum(["primeira_consulta", "retorno"], {
  required_error: "Tipo é obrigatório",
});

export const consultaSchema = z.object({
  dataConsulta: z
    .string()
    .min(1, "Data é obrigatória")
    .refine((v) => !isNaN(Date.parse(v)), "Data inválida")
    .refine((v) => new Date(v) <= new Date(), "Data não pode ser no futuro"),
  tipo: tipoConsultaEnum,
});

export type ConsultaFormData = z.infer<typeof consultaSchema>;
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: build succeeds with no new TypeScript errors (nothing consumes these yet, so this only checks the new files themselves are valid).

- [ ] **Step 4: Commit**

```bash
git add src/types/index.ts src/lib/validations/consulta.ts
git commit -m "feat(consultas): add Consulta type and validation schema"
```

---

### Task 2: Backend — list and create consultations

**Files:**
- Create: `src/app/api/pacientes/[id]/consultas/route.ts`

**Interfaces:**
- Consumes: `getAuth` (`@/lib/auth-helpers`), `readCollection`/`writeCollection` (`@/lib/db`), `consultaSchema` (Task 1), `Paciente`/`Consulta` types (Task 1 + existing).
- Produces: `GET /api/pacientes/:id/consultas` → `{ data: Consulta[] }` (sorted most-recent-first); `POST /api/pacientes/:id/consultas` → `{ data: Consulta }` (201) — consumed by Task 7.

- [ ] **Step 1: Write the route**

Create `src/app/api/pacientes/[id]/consultas/route.ts`:

```ts
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds with no new errors.

- [ ] **Step 3: Verify behavior manually against a running server**

Run: `npm run dev`, then in a browser go to `http://localhost:3000/login` and sign in as the nutritionist. Go to `http://localhost:3000/pacientes`, create a test patient if none exists yet, and copy its id from the URL of its profile page (`/pacientes/<id>`).

Open the browser DevTools console on that same tab (so the `accessToken` cookie is sent automatically) and run:

```js
const pid = "<paste the patient id here>";
await fetch(`/api/pacientes/${pid}/consultas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataConsulta: "2026-08-01", tipo: "primeira_consulta" }) }).then(r => r.json());
await fetch(`/api/pacientes/${pid}/consultas`).then(r => r.json());
```

Expected: the `POST` returns `{ data: { ... tipo: "primeira_consulta", dataConsulta: "2026-08-01T00:00:00.000Z", ... } }` with status 201; the `GET` returns `{ data: [ <that consultation> ] }`. Also verify `POST` with a future date (e.g. `"2099-01-01"`) returns `{ error: "Dados inválidos", ... }` with status 400.

- [ ] **Step 4: Commit**

```bash
git add src/app/api/pacientes/[id]/consultas/route.ts
git commit -m "feat(consultas): add list/create API route"
```

---

### Task 3: Backend — edit and delete a consultation

**Files:**
- Create: `src/app/api/pacientes/[id]/consultas/[consultaId]/route.ts`

**Interfaces:**
- Consumes: same as Task 2, plus reuses the pattern from `src/app/api/pacientes/[id]/route.ts` (PUT/DELETE with soft delete).
- Produces: `PUT /api/pacientes/:id/consultas/:consultaId` → `{ data: Consulta }`; `DELETE /api/pacientes/:id/consultas/:consultaId` → `{ message: string }` — consumed by Task 7.

- [ ] **Step 1: Write the route**

Create `src/app/api/pacientes/[id]/consultas/[consultaId]/route.ts`:

```ts
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds with no new errors.

- [ ] **Step 3: Verify behavior manually**

With the dev server running and logged in (same session as Task 2), in the browser console:

```js
const pid = "<same patient id as before>";
const created = await fetch(`/api/pacientes/${pid}/consultas`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataConsulta: "2026-07-01", tipo: "retorno" }) }).then(r => r.json());
const cid = created.data.id;
await fetch(`/api/pacientes/${pid}/consultas/${cid}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ dataConsulta: "2026-07-02", tipo: "retorno" }) }).then(r => r.json());
await fetch(`/api/pacientes/${pid}/consultas/${cid}`, { method: "DELETE" }).then(r => r.json());
await fetch(`/api/pacientes/${pid}/consultas`).then(r => r.json());
```

Expected: the `PUT` returns the updated consultation with `dataConsulta: "2026-07-02T00:00:00.000Z"`; the `DELETE` returns `{ message: "Consulta removida com sucesso" }`; the final `GET` no longer includes that consultation's id.

- [ ] **Step 4: Commit**

```bash
git add "src/app/api/pacientes/[id]/consultas/[consultaId]/route.ts"
git commit -m "feat(consultas): add edit/delete API route with soft delete"
```

---

### Task 4: Generalize the delete-confirmation dialog

**Files:**
- Create: `src/components/ui/confirm-delete-dialog.tsx`
- Modify: `src/components/pacientes/DeletePatientDialog.tsx` (full replacement)

**Interfaces:**
- Produces: `ConfirmDeleteDialog({ open, onOpenChange, title, description, onConfirm, loading? })` where `description: React.ReactNode` — consumed by Task 7 for deleting a consultation, and by the now-refactored `DeletePatientDialog`.

- [ ] **Step 1: Create the generic dialog**

Create `src/components/ui/confirm-delete-dialog.tsx`:

```tsx
"use client";

import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: ReactNode;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmDeleteDialog({ open, onOpenChange, title, description, onConfirm, loading }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={loading}>
            {loading ? "Excluindo..." : "Confirmar exclusão"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

- [ ] **Step 2: Migrate `DeletePatientDialog` to use it**

Replace the full contents of `src/components/pacientes/DeletePatientDialog.tsx` with:

```tsx
"use client";

import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pacienteNome: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function DeletePatientDialog({ open, onOpenChange, pacienteNome, onConfirm, loading }: Props) {
  return (
    <ConfirmDeleteDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Excluir paciente?"
      description={
        <>
          Tem certeza que deseja excluir <strong>{pacienteNome}</strong>? Esta ação fará soft delete (o paciente não aparecerá nas listagens, mas o histórico será preservado).
        </>
      }
      onConfirm={onConfirm}
      loading={loading}
    />
  );
}
```

This keeps `DeletePatientDialog`'s public props exactly the same, so nothing that calls it needs to change.

- [ ] **Step 3: Verify it compiles**

Run: `npm run build`
Expected: build succeeds with no new errors.

- [ ] **Step 4: Verify no regression in patient deletion**

Run: `npm run dev`, open a patient's profile page in the browser, click "Excluir", confirm the dialog still shows "Excluir paciente?" with the patient's name bolded, and that clicking "Confirmar exclusão" still soft-deletes the patient and redirects to `/pacientes` (same behavior as before this change).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/confirm-delete-dialog.tsx src/components/pacientes/DeletePatientDialog.tsx
git commit -m "refactor(ui): extract generic ConfirmDeleteDialog from DeletePatientDialog"
```

---

### Task 5: `ConsultaForm` component

**Files:**
- Create: `src/components/pacientes/ConsultaForm.tsx`

**Interfaces:**
- Consumes: `consultaSchema`/`ConsultaFormData` (Task 1), `Button`/`Input`/`Label`/`Select` (existing `src/components/ui`).
- Produces: `ConsultaForm({ defaultValues?: Partial<ConsultaFormData>, onSubmit: (data: ConsultaFormData) => Promise<void>, isSubmitting?: boolean, onCancel?: () => void })` — consumed by Task 7.

- [ ] **Step 1: Write the component**

Create `src/components/pacientes/ConsultaForm.tsx`:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { consultaSchema, type ConsultaFormData } from "@/lib/validations/consulta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

interface Props {
  defaultValues?: Partial<ConsultaFormData>;
  onSubmit: (data: ConsultaFormData) => Promise<void>;
  isSubmitting?: boolean;
  onCancel?: () => void;
}

export function ConsultaForm({ defaultValues, onSubmit, isSubmitting, onCancel }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ConsultaFormData>({
    resolver: zodResolver(consultaSchema),
    defaultValues: {
      dataConsulta: defaultValues?.dataConsulta || new Date().toISOString().slice(0, 10),
      tipo: defaultValues?.tipo || "retorno",
    },
  });

  async function submit(data: ConsultaFormData) {
    await onSubmit(data);
    reset({ dataConsulta: new Date().toISOString().slice(0, 10), tipo: "retorno" });
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-4 rounded-lg border p-4 bg-card">
      <h4 className="font-semibold text-sm">{defaultValues ? "Editar consulta" : "Nova consulta"}</h4>
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="dataConsulta">Data *</Label>
          <Input id="dataConsulta" type="date" {...register("dataConsulta")} />
          {errors.dataConsulta && <p role="alert" className="text-xs text-destructive">{errors.dataConsulta.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="tipo">Tipo *</Label>
          <Select id="tipo" {...register("tipo")}>
            <option value="primeira_consulta">Primeira consulta</option>
            <option value="retorno">Retorno</option>
          </Select>
          {errors.tipo && <p role="alert" className="text-xs text-destructive">{errors.tipo.message}</p>}
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        )}
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : defaultValues ? "Salvar alterações" : "Adicionar consulta"}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds with no new errors. (This component isn't wired into any page yet — full interactive behavior is verified in Task 7.)

- [ ] **Step 3: Commit**

```bash
git add src/components/pacientes/ConsultaForm.tsx
git commit -m "feat(consultas): add ConsultaForm component"
```

---

### Task 6: `ConsultaList` component

**Files:**
- Create: `src/components/pacientes/ConsultaList.tsx`

**Interfaces:**
- Consumes: `Consulta` type (Task 1), `formatDate` (`@/lib/formatters`, existing), `Button` (existing).
- Produces: `ConsultaList({ consultas: Consulta[], onEdit: (consulta: Consulta) => void, onDelete: (consulta: Consulta) => void })` — consumed by Task 7.

- [ ] **Step 1: Write the component**

Create `src/components/pacientes/ConsultaList.tsx`:

```tsx
"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/formatters";
import type { Consulta } from "@/types";

const TIPO_LABEL: Record<Consulta["tipo"], string> = {
  primeira_consulta: "Primeira consulta",
  retorno: "Retorno",
};

interface Props {
  consultas: Consulta[];
  onEdit: (consulta: Consulta) => void;
  onDelete: (consulta: Consulta) => void;
}

export function ConsultaList({ consultas, onEdit, onDelete }: Props) {
  if (consultas.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-6">Nenhuma consulta registrada ainda.</p>;
  }

  return (
    <div className="space-y-2">
      {consultas.map((c) => (
        <div key={c.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-md border p-3 text-sm">
          <div>
            <span className="font-medium">{formatDate(c.dataConsulta)}</span>
            <span className="text-muted-foreground"> — {TIPO_LABEL[c.tipo]}</span>
          </div>
          <div className="flex justify-end gap-1">
            <Button variant="ghost" size="icon" onClick={() => onEdit(c)} title="Editar">
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => onDelete(c)} title="Excluir">
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
```

Note: `variant="ghost" size="icon"` (40×40px) with a `title` attribute is the exact pattern `PatientTable.tsx` already uses for row actions — kept consistent rather than introducing a one-off larger touch target just for this list.

- [ ] **Step 2: Verify it compiles**

Run: `npm run build`
Expected: build succeeds with no new errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/pacientes/ConsultaList.tsx
git commit -m "feat(consultas): add ConsultaList component"
```

---

### Task 7: Wire it into the patient profile page

**Files:**
- Modify: `src/app/pacientes/[id]/page.tsx`

**Interfaces:**
- Consumes: everything produced by Tasks 1–6 (`Consulta` type, the two API routes, `ConfirmDeleteDialog`, `ConsultaForm`, `ConsultaList`, `ConsultaFormData`).
- Produces: the finished, user-facing feature — nothing later depends on this task.

- [ ] **Step 1: Update imports**

In `src/app/pacientes/[id]/page.tsx`, change:

```tsx
import { EvolutionChart } from "@/components/pacientes/EvolutionChart";
import { EvolutionForm } from "@/components/pacientes/EvolutionForm";
import { formatDate, calcIdade, getInitials } from "@/lib/formatters";
import type { Paciente, EvolucaoFisica } from "@/types";
import type { EvolucaoFormData } from "@/lib/validations/paciente";
```

to:

```tsx
import { EvolutionChart } from "@/components/pacientes/EvolutionChart";
import { EvolutionForm } from "@/components/pacientes/EvolutionForm";
import { ConsultaForm } from "@/components/pacientes/ConsultaForm";
import { ConsultaList } from "@/components/pacientes/ConsultaList";
import { ConfirmDeleteDialog } from "@/components/ui/confirm-delete-dialog";
import { formatDate, calcIdade, getInitials } from "@/lib/formatters";
import type { Paciente, EvolucaoFisica, Consulta } from "@/types";
import type { EvolucaoFormData } from "@/lib/validations/paciente";
import type { ConsultaFormData } from "@/lib/validations/consulta";
```

- [ ] **Step 2: Add state and data loading**

Change:

```tsx
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [evolucoes, setEvolucoes] = useState<EvolucaoFisica[]>([]);
  const [loading, setLoading] = useState(true);
  const [evoLoading, setEvoLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
```

to:

```tsx
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [evolucoes, setEvolucoes] = useState<EvolucaoFisica[]>([]);
  const [consultas, setConsultas] = useState<Consulta[]>([]);
  const [loading, setLoading] = useState(true);
  const [evoLoading, setEvoLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [consultaFormOpen, setConsultaFormOpen] = useState(false);
  const [editingConsulta, setEditingConsulta] = useState<Consulta | null>(null);
  const [consultaLoading, setConsultaLoading] = useState(false);
  const [deleteConsultaTarget, setDeleteConsultaTarget] = useState<Consulta | null>(null);
  const [deletingConsulta, setDeletingConsulta] = useState(false);
```

Change:

```tsx
  async function loadEvolucoes() {
    const res = await fetch(`/api/pacientes/${params.id}/evolucao`);
    if (res.ok) {
      const json = await res.json();
      setEvolucoes(json.data);
    }
  }

  useEffect(() => {
    async function load() {
      try {
        await loadPaciente();
        await loadEvolucoes();
      } catch (e) {
        setError(e instanceof Error ? e.message : "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);
```

to:

```tsx
  async function loadEvolucoes() {
    const res = await fetch(`/api/pacientes/${params.id}/evolucao`);
    if (res.ok) {
      const json = await res.json();
      setEvolucoes(json.data);
    }
  }

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
        setError(e instanceof Error ? e.message : "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id]);
```

- [ ] **Step 3: Add the consultation handlers**

Immediately after the existing `handleAddEvolucao` function (before `handleDelete`), add:

```tsx
  async function handleSaveConsulta(data: ConsultaFormData) {
    setConsultaLoading(true);
    try {
      const url = editingConsulta
        ? `/api/pacientes/${params.id}/consultas/${editingConsulta.id}`
        : `/api/pacientes/${params.id}/consultas`;
      const method = editingConsulta ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Erro ao salvar consulta");
      }
      await loadConsultas();
      setConsultaFormOpen(false);
      setEditingConsulta(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setConsultaLoading(false);
    }
  }

  function handleEditConsulta(consulta: Consulta) {
    setEditingConsulta(consulta);
    setConsultaFormOpen(true);
  }

  async function handleDeleteConsulta() {
    if (!deleteConsultaTarget) return;
    setDeletingConsulta(true);
    try {
      const res = await fetch(`/api/pacientes/${params.id}/consultas/${deleteConsultaTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir consulta");
      await loadConsultas();
      setDeleteConsultaTarget(null);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir");
    } finally {
      setDeletingConsulta(false);
    }
  }
```

- [ ] **Step 4: Add the "última consulta" derived value**

Immediately before the `if (loading) {` guard, add:

```tsx
  const ultimaConsulta = consultas[0] ?? null;
```

(`consultas` is already sorted most-recent-first by the API, so index `0` is the latest one.)

- [ ] **Step 5: Show "última consulta" in the profile header**

Change:

```tsx
              <p className="text-xs text-muted-foreground">Cadastrado em {formatDate(paciente.createdAt)} • Atualizado em {formatDate(paciente.updatedAt)}</p>
```

to:

```tsx
              <p className="text-xs text-muted-foreground">Cadastrado em {formatDate(paciente.createdAt)} • Atualizado em {formatDate(paciente.updatedAt)}</p>
              <p className="text-xs text-muted-foreground">
                {ultimaConsulta ? `Última consulta: ${formatDate(ultimaConsulta.dataConsulta)}` : "Nenhuma consulta registrada"}
              </p>
```

- [ ] **Step 6: Add the "Consultas" tab**

Change:

```tsx
      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="questionarios">Questionários</TabsTrigger>
        </TabsList>
```

to:

```tsx
      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="grid w-full grid-cols-4 max-w-[520px]">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="consultas">Consultas</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="questionarios">Questionários</TabsTrigger>
        </TabsList>
```

Then, immediately after the closing `</TabsContent>` of the `dados` tab and before the `evolucao` tab's `<TabsContent value="evolucao" ...>`, add:

```tsx
        <TabsContent value="consultas" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Consultas</h3>
            {!consultaFormOpen && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingConsulta(null);
                  setConsultaFormOpen(true);
                }}
              >
                Nova consulta
              </Button>
            )}
          </div>

          {consultaFormOpen && (
            <ConsultaForm
              key={editingConsulta?.id ?? "new"}
              defaultValues={
                editingConsulta
                  ? { dataConsulta: editingConsulta.dataConsulta.slice(0, 10), tipo: editingConsulta.tipo }
                  : undefined
              }
              onSubmit={handleSaveConsulta}
              isSubmitting={consultaLoading}
              onCancel={() => {
                setConsultaFormOpen(false);
                setEditingConsulta(null);
              }}
            />
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico ({consultas.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ConsultaList consultas={consultas} onEdit={handleEditConsulta} onDelete={setDeleteConsultaTarget} />
            </CardContent>
          </Card>
        </TabsContent>
```

- [ ] **Step 7: Fix the outdated placeholder text and add the delete dialog**

Change:

```tsx
        <TabsContent value="questionarios" className="mt-4">
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-sm text-muted-foreground">Questionários vinculados aparecerão aqui a partir da v0.4.</p>
              <p className="text-xs text-muted-foreground mt-1">Agendamento e envios serão configurados nas próximas versões.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DeletePatientDialog open={deleteOpen} onOpenChange={setDeleteOpen} pacienteNome={paciente.nomeCompleto} onConfirm={handleDelete} loading={deleting} />
    </div>
  );
}
```

to:

```tsx
        <TabsContent value="questionarios" className="mt-4">
          <Card>
            <CardContent className="p-10 text-center">
              <p className="text-sm text-muted-foreground">Questionários vinculados aparecerão aqui quando o agendamento de envio for implementado.</p>
              <p className="text-xs text-muted-foreground mt-1">Agendamento e envio de questionários serão configurados no próximo ciclo do roadmap.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <DeletePatientDialog open={deleteOpen} onOpenChange={setDeleteOpen} pacienteNome={paciente.nomeCompleto} onConfirm={handleDelete} loading={deleting} />

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

- [ ] **Step 8: Verify it compiles**

Run: `npm run build`
Expected: build succeeds with no new errors.

- [ ] **Step 9: Verify every acceptance criterion manually**

Run: `npm run dev`, log in, open a patient with no consultations yet, and walk through:

- **CA-22:** Open the "Consultas" tab → see "Nenhuma consulta registrada ainda." and the header shows "Nenhuma consulta registrada".
- **CA-23:** Click "Nova consulta", fill a valid date and a type, save → it appears at the top of the list.
- **CA-24:** Click "Nova consulta" again, pick a future date → see the inline error and confirm nothing was added to the list.
- **CA-25:** Click the trash icon on a consultation, confirm in the dialog → it disappears from the list; if it was the only one, the header goes back to "Nenhuma consulta registrada".
- **CA-26:** Add two consultations with different dates → the header's "Última consulta" always shows the most recent date, regardless of the order you added them in.
- **CA-27:** With DevTools open, switch the viewport to 375px, 768px and 1440px and confirm the "Consultas" tab (tab bar, form, list) has no horizontal scroll and every button stays clickable.

Also re-check patient deletion still works (regression check from Task 4).

- [ ] **Step 10: Commit**

```bash
git add "src/app/pacientes/[id]/page.tsx"
git commit -m "feat(consultas): wire Histórico de Consultas into patient profile"
```

---

## Self-Review Notes

- **Spec coverage:** RF-37–RF-43 → Tasks 2, 3, 7 (list, create, edit, delete, future-date rejection, "última consulta" display, deleted rows excluded). CA-22–CA-27 → all checked explicitly in Task 7 Step 9. §5.2 duplication concern (DeletePatientDialog) → Task 4. §7 file table → every row maps to a task (`src/data/consultas.json` is created automatically at runtime by `readCollection`, no task needed for it).
- **Placeholder scan:** no TBD/TODO; every step has literal code or literal verification commands.
- **Type consistency:** `ConsultaFormData` (Task 1) is the type used by `ConsultaForm`'s `onSubmit`/`defaultValues` (Task 5) and by `handleSaveConsulta` (Task 7); `Consulta` (Task 1) is the type used by `ConsultaList`'s props (Task 6), by `consultas`/`editingConsulta`/`deleteConsultaTarget` state (Task 7), and by both API routes (Tasks 2–3); `ConfirmDeleteDialog`'s `description: ReactNode` (Task 4) matches how both `DeletePatientDialog` (JSX with `<strong>`) and Task 7 (plain string) call it.

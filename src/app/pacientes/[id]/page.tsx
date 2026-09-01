"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Loader2, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/pacientes/StatusBadge";
import { DeletePatientDialog } from "@/components/pacientes/DeletePatientDialog";
import { EvolutionChart } from "@/components/pacientes/EvolutionChart";
import { EvolutionForm } from "@/components/pacientes/EvolutionForm";
import { formatDate, calcIdade, getInitials } from "@/lib/formatters";
import type { Paciente, EvolucaoFisica } from "@/types";
import type { EvolucaoFormData } from "@/lib/validations/paciente";

export default function PacientePerfilPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [evolucoes, setEvolucoes] = useState<EvolucaoFisica[]>([]);
  const [loading, setLoading] = useState(true);
  const [evoLoading, setEvoLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function loadPaciente() {
    const res = await fetch(`/api/pacientes/${params.id}`);
    if (!res.ok) throw new Error("Paciente não encontrado");
    const json = await res.json();
    setPaciente(json.data);
  }

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

  async function handleAddEvolucao(data: EvolucaoFormData) {
    setEvoLoading(true);
    try {
      const res = await fetch(`/api/pacientes/${params.id}/evolucao`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Erro ao salvar evolução");
      }
      await loadEvolucoes();
      setShowForm(false);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setEvoLoading(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/pacientes/${params.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Erro ao excluir");
      router.push("/pacientes");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Erro ao excluir");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !paciente) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <p className="text-destructive text-sm">{error || "Paciente não encontrado"}</p>
        <Button asChild variant="outline">
          <Link href="/pacientes">Voltar para pacientes</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/pacientes">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-bold tracking-tight truncate">{paciente.nomeCompleto}</h1>
          <p className="text-sm text-muted-foreground">{paciente.email} • {paciente.telefone}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" asChild>
            <Link href={`/pacientes/${paciente.id}/editar`}>
              <Pencil className="h-4 w-4 mr-1" /> Editar
            </Link>
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 mr-1" /> Excluir
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4 items-center">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">{getInitials(paciente.nomeCompleto)}</AvatarFallback>
            </Avatar>
            <div className="space-y-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold">{paciente.nomeCompleto}</span>
                <StatusBadge status={paciente.status} />
              </div>
              <p className="text-sm text-muted-foreground">
                {calcIdade(paciente.dataNascimento)} anos • {paciente.sexo} • {paciente.objetivo.replace("_", " ")} • {paciente.nivelAtividadeFisica}
              </p>
              <p className="text-xs text-muted-foreground">Cadastrado em {formatDate(paciente.createdAt)} • Atualizado em {formatDate(paciente.updatedAt)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="dados" className="w-full">
        <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
          <TabsTrigger value="dados">Dados</TabsTrigger>
          <TabsTrigger value="evolucao">Evolução</TabsTrigger>
          <TabsTrigger value="questionarios">Questionários</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Dados pessoais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 grid-cols-1 md:grid-cols-2 text-sm">
              <div><span className="text-muted-foreground">Nome:</span> {paciente.nomeCompleto}</div>
              <div><span className="text-muted-foreground">Nascimento:</span> {formatDate(paciente.dataNascimento)} ({calcIdade(paciente.dataNascimento)}a)</div>
              <div><span className="text-muted-foreground">Sexo:</span> {paciente.sexo}</div>
              <div><span className="text-muted-foreground">Telefone:</span> {paciente.telefone}</div>
              <div className="md:col-span-2"><span className="text-muted-foreground">E-mail:</span> {paciente.email}</div>
              <div><span className="text-muted-foreground">Status:</span> <StatusBadge status={paciente.status} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Medidas iniciais</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 grid-cols-1 md:grid-cols-3 text-sm">
              <div><span className="text-muted-foreground">Peso:</span> {paciente.pesoInicial} kg</div>
              <div><span className="text-muted-foreground">Altura:</span> {paciente.altura} m</div>
              <div><span className="text-muted-foreground">% Gordura:</span> {paciente.percentualGordura ?? "—"} {paciente.percentualGordura ? "%" : ""}</div>
              <div><span className="text-muted-foreground">Cintura:</span> {paciente.circunferenciaCintura ?? "—"} {paciente.circunferenciaCintura ? "cm" : ""}</div>
              <div><span className="text-muted-foreground">Quadril:</span> {paciente.circunferenciaQuadril ?? "—"} {paciente.circunferenciaQuadril ? "cm" : ""}</div>
              <div><span className="text-muted-foreground">Braço:</span> {paciente.circunferenciaBraco ?? "—"} {paciente.circunferenciaBraco ? "cm" : ""}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Objetivo e histórico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div><span className="text-muted-foreground">Objetivo:</span> {paciente.objetivo.replace("_", " ")}</div>
              <div><span className="text-muted-foreground">Nível atividade:</span> {paciente.nivelAtividadeFisica}</div>
              <Separator />
              <div><span className="text-muted-foreground block mb-1">Restrições alimentares:</span> {paciente.restricoesAlimentares || "—"}</div>
              <div><span className="text-muted-foreground block mb-1">Histórico clínico:</span> {paciente.historicoClinico || "—"}</div>
              <div><span className="text-muted-foreground block mb-1">Observações:</span> {paciente.observacoes || "—"}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="evolucao" className="space-y-4 mt-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Evolução física</h3>
            {!showForm && (
              <Button size="sm" onClick={() => setShowForm(true)}>
                Nova medição
              </Button>
            )}
          </div>

          {showForm && <EvolutionForm onSubmit={handleAddEvolucao} isSubmitting={evoLoading} onCancel={() => setShowForm(false)} />}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Gráfico de peso</CardTitle>
            </CardHeader>
            <CardContent>
              <EvolutionChart evolucoes={evolucoes} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Histórico ({evolucoes.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {evolucoes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">Nenhuma medição registrada ainda.</p>
              ) : (
                <div className="space-y-2">
                  {[...evolucoes].reverse().map((e) => (
                    <div key={e.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 rounded-md border p-3 text-sm">
                      <div className="font-medium">{formatDate(e.dataAvaliacao)} — {e.peso} kg</div>
                      <div className="text-xs text-muted-foreground flex gap-3 flex-wrap">
                        {e.percentualGordura && <span>%G {e.percentualGordura}%</span>}
                        {e.circunferenciaCintura && <span>Cint {e.circunferenciaCintura}cm</span>}
                        {e.circunferenciaQuadril && <span>Quadril {e.circunferenciaQuadril}cm</span>}
                        {e.circunferenciaBraco && <span>Braço {e.circunferenciaBraco}cm</span>}
                      </div>
                      {e.observacoes && <p className="text-xs text-muted-foreground sm:w-full">{e.observacoes}</p>}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

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

# Plano de Implantação — PlanoNutri

**Documentos de referência:** `requisitos.md`, `DDR — Design Decision Record.md`, `Design System Documentation.md`, `spec.md`

**Convenção de specs:** a partir deste ciclo, a spec detalhada de cada feature (RF, CA, passo a passo) vive em `feature/{nome-da-feature}.md`, seguindo o guia de `doc/spec.md`. Este documento (`plano-implantacao.md`) mantém só a visão de roadmap entre ciclos.

---

## Visão Geral das Versões

| Versão | Foco | Status |
|---|---|---|
| **v0.1** | Infraestrutura base + autenticação da nutricionista | ✅ Implementado |
| **v0.2** | Cadastro completo de pacientes (CRUD, evolução física, soft delete) | ✅ Implementado |
| **v0.3** | Banco de perguntas + criação de questionários | ✅ Implementado |
| **v0.4** | Histórico de Consultas | 🔜 Próximo ciclo — spec em `feature/historico-consultas.md` |
| **v0.5** | Agendamento de envio + envio efetivo (e-mail) + recebimento de respostas | ⏳ Planejado — depende de v0.4 |
| **v0.6** | Dashboard simplificado | ⏳ Planejado — depende de v0.5 |

---

## v0.1 a v0.3 — Já Implementados

Cobrem: autenticação da nutricionista (JWT), CRUD completo de pacientes com evolução física e soft delete, banco de perguntas reutilizável (texto livre, múltipla escolha, escala, numérico, sim/não) e criação/edição de questionários com reordenação de perguntas.

Persistência: arquivos JSON locais (`src/data/*.json`) via `src/lib/db.ts` — ver DR-010 sobre os limites disso em produção serverless.

---

## v0.4 — Histórico de Consultas

**Objetivo:** registrar, por paciente, as consultas já realizadas (data + tipo), servindo de referência temporal para o agendamento de questionários (DR-004: "X dias/meses após a última consulta").

**Por que agora:** identificado como uma lacuna real do sistema — hoje não existe onde registrar quando foi a última consulta, o que o requisito de agendamento relativo já pressupõe.

**Escopo:** ver spec completa em `feature/historico-consultas.md`. Resumo: entidade `Consulta` (data + tipo: primeira consulta/retorno), CRUD dentro do perfil do paciente, soft delete, exibição da "última consulta" em destaque. Não inclui registro de orientação/plano passado nem observações clínicas (DR-009).

**DDRs relacionados:** DR-009.

---

## v0.5 — Agendamento de Envio + Envio Efetivo + Recebimento

**Objetivo:** fechar o núcleo de valor do produto — a nutricionista configura quando enviar um questionário (prazo relativo à última consulta/ao cadastro, data fixa, ou recorrência), o sistema dispara o e-mail automaticamente e o paciente responde por um link público, sem login.

**Por que uma spec só (e não separada em "configurar" e "enviar" como cogitado antes):** o usuário confirmou que o foco principal do sistema é justamente cadastro de paciente + envio/recebimento de questionário — faz mais sentido entregar o ciclo completo de uma vez do que configurar agendamento sem nunca disparar de verdade.

**Decisões técnicas já tomadas (ver DDR):**
- Reaproveitar o modelo `Envio` já tipado em `src/types/index.ts` (DR-004, DR-005, DR-006).
- Envio de e-mail via **Resend**; execução do agendamento/recorrência via **Vercel Cron Jobs** (DR-011).
- Recebimento via rota pública `/responder/[token]`, reaproveitando os componentes de tipo de pergunta já existentes no banco de perguntas.
- Status "atrasado" calculado sob demanda (sem persistir), evitando infraestrutura de fila/worker.
- Cancelamento em cascata de envios agendados quando o paciente muda para "inativo".

**Bloqueio a resolver antes de produção:** migração de persistência (DR-010) — JSON local não é confiável em deploy serverless para envio/recebimento real. Pode-se desenvolver e testar em ambiente local antes disso, mas não deve ir ao ar sem a migração.

**Decisões ainda em aberto (resolver ao especificar esta versão):**
- Política de expiração do link de questionário.
- Estratégia de reenvio automático (novo token vs. reaproveitar).

**Próximo passo:** brainstormar e escrever a spec detalhada em `feature/agendamento-envio.md` quando este ciclo começar.

---

## v0.6 — Dashboard Simplificado

**Objetivo:** tela inicial com lista objetiva de questionários pendentes/atrasados e link rápido para o paciente correspondente — sem cards de métricas agregadas (DR-012).

**Por que por último:** só faz sentido depois que existir envio/resposta real para listar (v0.5).

---

## Mapa de Rastreabilidade

| Versão | Requisitos | DDRs |
|---|---|---|
| v0.1–v0.3 | requisitos.md §2.1, §2.3 (perguntas/questionários) | DR-001, DR-002, DR-003, DR-008 |
| v0.4 | requisitos.md §2.2 (Histórico de Consultas) | DR-009 |
| v0.5 | requisitos.md §2.3 (agendamento e canais) | DR-004, DR-005, DR-006, DR-010, DR-011 |
| v0.6 | requisitos.md §5 (Dashboard) | DR-012 |

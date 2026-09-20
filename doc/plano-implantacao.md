# Plano de Implantação — PlanoNutri

**Documentos de referência:** `requisitos.md`, `DDR — Design Decision Record.md`, `Design System Documentation.md`, `spec.md`

**Convenção de specs:** a partir do ciclo de Histórico de Consultas, a spec detalhada de cada feature (RF, CA, passo a passo) vive em `feature/{nome-da-feature}.md`, seguindo o guia de `doc/spec.md`. Este documento (`plano-implantacao.md`) mantém só a visão de roadmap entre ciclos.

---

## Visão Geral das Versões

| Versão | Foco | Status |
|---|---|---|
| **v0.1** | Infraestrutura base + autenticação da nutricionista | ✅ Implementado |
| **v0.2** | Cadastro completo de pacientes (CRUD, evolução física, soft delete) | ✅ Implementado |
| **v0.3** | Banco de perguntas + criação de questionários | ✅ Implementado |
| **v0.4** | Histórico de Consultas | ✅ Implementado |
| **v0.5** | Agendamento de envio (configuração — sem disparo) | 🔜 Próximo ciclo — spec em `feature/agendamento-envio.md` |
| **v0.6** | Dashboard simplificado | ⏳ Planejado — depende de v0.5 |
| **v0.7** | Cadastro de plano alimentar | ⏳ Planejado |
| **v0.8** | Agenda de consultas integrada | ⏳ Planejado |
| **v0.9** | Integração com balanças/bioimpedância | ⏳ Planejado |
| **v0.10** | Geração automática de relatório de evolução em PDF | ⏳ Planejado |
| **v0.11** | Chat direto entre nutricionista e paciente | ⏳ Planejado |
| **v0.12** | Disparo efetivo do questionário (canal a decidir) + Recebimento de respostas | ⏳ Planejado — **último ciclo**, ver DR-014 |

**Cobrança/pagamento online** saiu do roadmap: o usuário confirmou que não pretende cobrar dos pacientes (não é mais uma evolução futura cogitada).

---

## v0.1 a v0.4 — Já Implementados

Cobrem: autenticação da nutricionista (JWT), CRUD completo de pacientes com evolução física e soft delete, banco de perguntas reutilizável (texto livre, múltipla escolha, escala, numérico, sim/não), criação/edição de questionários com reordenação de perguntas, e Histórico de Consultas (data + tipo, por paciente — `feature/historico-consultas.md`, DR-009).

Persistência: arquivos JSON locais (`src/data/*.json`) via `src/lib/db.ts` — ver DR-010 sobre os limites disso em produção serverless.

---

## v0.5 — Agendamento de Envio (configuração, sem disparo)

**Objetivo:** a nutricionista configura quando um questionário deveria ser enviado (prazo relativo ao cadastro ou à última consulta, ou data fixa) e vê isso numa lista de agendamentos. **Nenhum disparo real ou simulado acontece neste ciclo** — decisão do usuário, porque o canal (e-mail, WhatsApp ou outro) ainda não foi escolhido (DR-013, DR-014).

**Escopo:** ver spec completa em `feature/agendamento-envio.md`. Resumo: entidade `Envio` simplificada (sem token/link/recorrência), cálculo automático da data prevista, cancelamento manual e em cascata (paciente inativo), tela `/envios` e integração na aba "Questionários" do perfil do paciente.

**DDRs relacionados:** DR-004 (parcial), DR-009, DR-013, DR-014.

---

## v0.6 — Dashboard Simplificado

**Objetivo:** tela inicial com lista objetiva de questionários pendentes/atrasados e link rápido para o paciente correspondente — sem cards de métricas agregadas (DR-012).

**DDRs relacionados:** DR-012.

---

## v0.7 a v0.11 — Evoluções Futuras (antes fora de escopo, agora priorizadas)

Itens que `doc/requisitos.md` §4 listava como "fora do escopo inicial" e que passam a ter um lugar no roadmap, cada um com seu próprio ciclo de brainstorming → spec → plano quando chegar a vez:

- **v0.7 — Cadastro de plano alimentar:** revisita DR-007 (que hoje diz "fora do MVP"). Precisa de brainstorming próprio (estrutura de refeições, substituições, vínculo com o paciente).
- **v0.8 — Agenda de consultas integrada:** diferente do Histórico de Consultas (v0.4), que só registra consultas já realizadas — isso seria agendar consultas futuras.
- **v0.9 — Integração com balanças/bioimpedância:** depende de decidir qual hardware/API específica (bloqueio a resolver no brainstorming desse ciclo).
- **v0.10 — Geração de relatório de evolução em PDF.**
- **v0.11 — Chat direto entre nutricionista e paciente:** depende de decisão de infraestrutura de tempo real (bloqueio a resolver no brainstorming desse ciclo) — e reabre a decisão de DR-001/DR-002 sobre o paciente não ter login, já que um chat pressupõe alguma forma de identificação do paciente ao longo do tempo.

---

## v0.12 — Disparo Efetivo do Questionário + Recebimento (último ciclo)

**Objetivo:** finalmente enviar o questionário de verdade (e-mail, WhatsApp, ou o que for decidido) e receber a resposta do paciente por um link público.

**Por que por último:** o usuário ainda não decidiu o canal, e prefere não construir (nem simular) disparo até essa decisão existir, para não ter que retrabalhar a lógica depois (DR-014).

**Decisões que ficam pendentes até este ciclo começar (ver "Decisões em aberto" na DDR):**
- Canal de disparo (e-mail via Resend — DR-011 — WhatsApp, ou outro).
- Política de expiração do link de questionário (DR-005).
- Estratégia de reenvio automático.
- Regra de "resposta que indica atenção" (alerta para a nutricionista).
- Migração de persistência (DR-010) — bloqueia ir para produção com disparo/recebimento reais, ainda que sobre JSON local em desenvolvimento.

**Próximo passo quando começar:** brainstormar e escrever a spec em `feature/disparo-questionario.md`.

---

## Mapa de Rastreabilidade

| Versão | Requisitos | DDRs |
|---|---|---|
| v0.1–v0.3 | requisitos.md §2.1, §2.3 (perguntas/questionários) | DR-001, DR-002, DR-003, DR-008 |
| v0.4 | requisitos.md §2.2 (Histórico de Consultas) | DR-009 |
| v0.5 | requisitos.md §2.3 (agendamento) | DR-004, DR-013, DR-014 |
| v0.6 | requisitos.md §5 (Dashboard) | DR-012 |
| v0.7–v0.11 | requisitos.md §4 (Evoluções Futuras) | a definir por ciclo |
| v0.12 | requisitos.md §2.3 (canais e recebimento) | DR-005, DR-006, DR-010, DR-011, DR-014 |

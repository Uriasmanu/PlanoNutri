# Spec — Histórico de Consultas (v0.4)

> Segue o guia de `doc/spec.md`. Nenhum item em "Problemas Encontrados" de `spec.md` estava `[aberto]` no início deste ciclo.

---

## 1. Contexto e Objetivo

- **O que é:** registro, por paciente, das consultas já realizadas (data + tipo), com exibição da "última consulta" no perfil do paciente.
- **Por que existe:** o requisito de agendamento de questionário (`doc/requisitos.md` §2.3) usa "X dias/meses após a última consulta" como uma das formas de definir o prazo de envio, mas o sistema não tinha, até agora, nenhum lugar para registrar quando as consultas aconteceram. Essa lacuna foi identificada durante o replanejamento do roadmap (ver DR-009).
- **Quem usa:** a nutricionista, dentro do perfil do paciente.
- **Escopo:** registrar data e tipo de consulta já realizada, listar por paciente, editar, excluir (soft delete) e exibir a mais recente em destaque. Fora de escopo: conteúdo da orientação passada, observações clínicas livres, agenda de consultas futuras (ver `doc/requisitos.md` §4).

---

## 2. Análise dos Documentos de Referência

- **Guia de spec** (`doc/spec.md`): seções aplicadas abaixo.
- **Documento de requisitos** (`doc/requisitos.md` §2.2, nova seção adicionada neste ciclo).
- **DDR** (`doc/DDR — Design Decision Record.md`): DR-004 (agendamento relativo à última consulta), DR-009 (decisão desta feature).
- **Código-fonte relevante lido:** `src/app/pacientes/[id]/page.tsx`, `src/app/api/pacientes/[id]/evolucao/route.ts`, `src/app/api/pacientes/[id]/route.ts`, `src/lib/evolucao.ts`, `src/lib/validations/paciente.ts`, `src/components/pacientes/DeletePatientDialog.tsx`, `src/components/pacientes/EvolutionForm.tsx`, `src/types/index.ts`.

---

## 3. História de Usuário

```
Como nutricionista,
quero registrar quando cada consulta com um paciente aconteceu (e o tipo dela),
para que eu tenha um histórico de acompanhamento e possa agendar questionários com base na última consulta.
```

**Cenários alternativos:**
- Paciente sem nenhuma consulta registrada → estado vazio na aba, sem "última consulta" exibida no cabeçalho.
- Tentativa de registrar consulta com data no futuro → bloqueada com mensagem de erro (é um registro retroativo, não uma agenda).
- Exclusão da única consulta registrada → paciente volta a não ter "última consulta".

---

## 4. Requisitos Funcionais

- [ ] RF-37: O sistema exibe, na aba "Consultas" do perfil do paciente, a lista de consultas ordenada da mais recente para a mais antiga.
- [ ] RF-38: A nutricionista registra uma nova consulta informando data e tipo (primeira consulta ou retorno).
- [ ] RF-39: O sistema rejeita data de consulta no futuro.
- [ ] RF-40: A nutricionista edita uma consulta existente (data e/ou tipo).
- [ ] RF-41: A nutricionista exclui uma consulta mediante confirmação (soft delete).
- [ ] RF-42: O sistema exibe a data da consulta mais recente (não excluída) em destaque no cabeçalho do perfil do paciente.
- [ ] RF-43: Consultas excluídas (soft delete) não contam para o cálculo de "última consulta" nem aparecem na listagem padrão.

---

## 5. Requisitos Não Funcionais

- **Segurança:** todas as rotas exigem autenticação da nutricionista (mesmo padrão de `getAuth` já usado em `evolucao`); uma consulta só é acessível/editável pela nutricionista dona do paciente (`paciente.nutricionistaId === auth.nutricionistaId`).
- **Persistência:** arquivo `src/data/consultas.json` via `readCollection`/`writeCollection` de `src/lib/db.ts` — mesmo padrão de todas as coleções existentes (ver DR-010 sobre limitações em produção).
- **Observabilidade:** erros logados via `console.error("[consultas ...]", e)`, mesmo padrão das rotas existentes.

### 5.1 UI/UX Responsivo

- Nova `TabsTrigger` "Consultas" se soma às 3 existentes (dados/evolução/questionários) — o grid da `TabsList` (`grid-cols-3`) precisa virar `grid-cols-4` e a lista/cards internos devem seguir o mesmo padrão responsivo já usado na aba "Evolução" (cards empilhados em mobile, `flex-row` a partir de `sm:`).
- Testar em 375px, 768px, 1440px — sem overflow horizontal, botões com área de toque ≥44px.

### 5.2 Componentização e Reusabilidade

- **Duplicação identificada:** `DeletePatientDialog.tsx` está acoplado ao caso de uso "paciente" (título fixo "Excluir paciente?", prop `pacienteNome`). Excluir uma consulta precisaria do mesmo padrão de diálogo de confirmação.
  - **Decisão para este ciclo:** generalizar em `src/components/ui/confirm-delete-dialog.tsx` — props genéricas (`title`, `description`, `onConfirm`, `loading`) — e migrar `DeletePatientDialog` para usar esse componente por baixo (sem quebrar a API pública dele), em vez de criar um segundo diálogo hardcoded. Baixo custo de generalizar, alta chance de reuso (será usado de novo em Envios/Questionários).
- Nenhuma outra função nova identificada com potencial de reuso fora do próprio CRUD de consultas.

---

## 6. Análise da Aplicação

- **Arquitetura:** Next.js App Router, API Routes como backend, persistência file-based (`src/lib/db.ts`), sem camada de "repository" separada — a leitura/escrita acontece diretamente nas rotas (`readCollection`/`writeCollection`), com helpers de leitura pura em `src/lib/*.ts` quando reaproveitados fora da rota (ex: `src/lib/evolucao.ts`).
- **Padrão de nomenclatura:** camelCase nos tipos/campos (`dataConsulta`, não `data_consulta`), soft delete via `deletedAt: string | null`, todas as entidades de paciente têm `nutricionistaId` para escopo por usuário (DR-002).
- **Fluxo de dados:** `PacientePerfilPage` carrega paciente + coleções relacionadas via `fetch` para as API Routes no `useEffect`; segue esse mesmo padrão para consultas.
- **Contratos de API existentes:** `GET/POST /api/pacientes/[id]/evolucao` retornam `{ data: [...] }` / `{ data: {...} }` e erros como `{ error: string }` — replicar exatamente esse contrato para consultas.

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---|---|---|
| `src/types/index.ts` | Modificar | Adicionar `TipoConsulta` e a interface `Consulta` |
| `src/lib/validations/consulta.ts` | Criar | Schema Zod (`consultaSchema`) com validação de data não-futura e `tipo` enum |
| `src/app/api/pacientes/[id]/consultas/route.ts` | Criar | `GET` (listar por paciente) e `POST` (criar) |
| `src/app/api/pacientes/[id]/consultas/[consultaId]/route.ts` | Criar | `PUT` (editar) e `DELETE` (soft delete) |
| `src/components/ui/confirm-delete-dialog.tsx` | Criar | Diálogo de confirmação genérico (ver §5.2) |
| `src/components/pacientes/DeletePatientDialog.tsx` | Modificar | Passar a usar `ConfirmDeleteDialog` por baixo, sem mudar a API pública do componente |
| `src/components/pacientes/ConsultaList.tsx` | Criar | Lista de consultas (data, tipo, ações editar/excluir) |
| `src/components/pacientes/ConsultaForm.tsx` | Criar | Formulário de criar/editar (data + tipo), padrão de `EvolutionForm.tsx` |
| `src/app/pacientes/[id]/page.tsx` | Modificar | Nova aba "Consultas" (grid-cols-3 → grid-cols-4), exibição da "última consulta" no cabeçalho, e atualizar o texto da aba "Questionários" que hoje cita "v0.4" incorretamente (a versão mudou de significado neste replanejamento) |
| `src/data/consultas.json` | Criar (runtime) | Coleção nova, criada automaticamente por `readCollection()` (via `ensureDataDir()`) no primeiro acesso |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
- `DeletePatientDialog` acoplado ao domínio "paciente" — tratado em §5.2 (generalizar, não duplicar).
- Texto hardcoded em `src/app/pacientes/[id]/page.tsx:261` ("a partir da v0.4") ficou desatualizado com o replanejamento — deve ser removido/corrigido ao mexer nesse arquivo.

### 8.2 Ambiguidades nos Requisitos
- Nenhuma identificada — escopo foi reduzido deliberadamente ao mínimo (data + tipo) durante o brainstorming, evitando ambiguidade sobre "o que mais" deveria entrar no registro de consulta.

### 8.3 Riscos
- Baixo risco de regressão: a única mudança em código existente é o grid de tabs (3→4 colunas) e a extração do diálogo de confirmação — ambos isolados e cobertos pelos CAs de responsividade e pela reutilização do componente já testado.

---

## 9. Critérios de Aceite

- [ ] CA-22: Dado um paciente sem consultas, quando a nutricionista acessa a aba "Consultas", então uma mensagem de estado vazio é exibida (sem "última consulta" no cabeçalho).
- [ ] CA-23: Dado o registro de uma nova consulta com data e tipo válidos, quando salva, então ela aparece no topo da lista (mais recente primeiro).
- [ ] CA-24: Dado tentativa de registrar consulta com data futura, quando a nutricionista salva, então mensagem de erro é exibida no campo data e nada é persistido.
- [ ] CA-25: Dada uma consulta existente, quando a nutricionista exclui com confirmação, então ela recebe `deletedAt`, some da lista e deixa de contar como "última consulta".
- [ ] CA-26: Dado um paciente com 2+ consultas, quando a nutricionista visualiza o perfil, então a data exibida como "última consulta" é a mais recente entre as não excluídas.
- [ ] CA-27 (responsividade): Dado acesso em 375px, 768px e 1440px, quando a nutricionista abre a aba "Consultas", então o layout não quebra e os botões de ação têm área de toque ≥44px.

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Modelar tipos e validação
  - O que fazer: adicionar `TipoConsulta`/`Consulta` em src/types/index.ts; criar consultaSchema em src/lib/validations/consulta.ts (data obrigatória, válida, não-futura; tipo enum)
  - Arquivo(s): src/types/index.ts, src/lib/validations/consulta.ts
  - Como validar: `npm run build` sem erros de tipo

Passo 2: Criar backend de consultas
  - O que fazer: GET/POST em .../consultas/route.ts e PUT/DELETE em .../consultas/[consultaId]/route.ts, seguindo exatamente o padrão de auth/escopo por nutricionista já usado em evolucao/route.ts; DELETE faz soft delete (deletedAt)
  - Arquivo(s): src/app/api/pacientes/[id]/consultas/route.ts, src/app/api/pacientes/[id]/consultas/[consultaId]/route.ts
  - Como validar: criar, listar, editar e excluir consulta via requisições HTTP autenticadas; tentativa sem auth retorna 401; consulta de outro paciente/nutricionista retorna 404

Passo 3: Generalizar diálogo de confirmação
  - O que fazer: criar ConfirmDeleteDialog genérico; migrar DeletePatientDialog para usá-lo internamente sem mudar sua API pública
  - Arquivo(s): src/components/ui/confirm-delete-dialog.tsx, src/components/pacientes/DeletePatientDialog.tsx
  - Como validar: exclusão de paciente continua funcionando exatamente como antes (regressão manual)

Passo 4: Criar UI de consultas
  - O que fazer: ConsultaForm (data + tipo) e ConsultaList (tabela/cards com editar/excluir usando ConfirmDeleteDialog)
  - Arquivo(s): src/components/pacientes/ConsultaForm.tsx, src/components/pacientes/ConsultaList.tsx
  - Como validar: criar consulta de cada tipo, editar, excluir com confirmação

Passo 5: Integrar aba no perfil do paciente
  - O que fazer: adicionar TabsTrigger "Consultas" (grid-cols-3 → grid-cols-4), carregar consultas no useEffect existente, exibir "última consulta" no card de cabeçalho, corrigir texto desatualizado da aba Questionários
  - Arquivo(s): src/app/pacientes/[id]/page.tsx
  - Como validar: navegar para a aba, ver lista carregada, ver "última consulta" atualizada após criar/excluir

Passo 6: Testar responsividade
  - O que fazer: validar em 375px, 768px, 1440px conforme CA-27
  - Arquivo(s): src/app/pacientes/[id]/page.tsx, src/components/pacientes/ConsultaList.tsx
  - Como validar: DevTools nos três breakpoints, sem scroll horizontal indevido
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto (feature isolada, sem flag — mesmo padrão das features anteriores).
- **Como monitorar:** logs de erro no console do servidor (`console.error("[consultas ...]")`), mesmo padrão já usado.
- **Plano de rollback:** reverter o commit/PR; nenhuma migração destrutiva envolvida (arquivo JSON novo, não altera coleções existentes).

---

## 12. Definição de Pronto (DoD)

- [ ] Todos os critérios de aceite (CA-22 a CA-27) verificados manualmente
- [ ] `npm run build` sem erros/warnings novos
- [ ] `DeletePatientDialog` generalizado sem regressão no fluxo de exclusão de paciente
- [ ] Aba "Consultas" testada nos 3 breakpoints (§5.1)
- [ ] `doc/requisitos.md`, `doc/DDR — Design Decision Record.md` (DR-009) e `doc/plano-implantacao.md` já atualizados neste ciclo de planejamento — nenhuma pendência de documentação após a implementação

# Spec — Agendamento de Envio (v0.5, configuração)

> Segue o guia de `doc/spec.md`. Nenhum item em "Problemas Encontrados" estava `[aberto]` no início deste ciclo.

---

## 1. Contexto e Objetivo

- **O que é:** a nutricionista configura **quando** um questionário deveria ser enviado a um paciente (prazo relativo ao cadastro ou à última consulta, ou data fixa). O sistema calcula e guarda a data prevista, mas **não envia nada** — nenhum e-mail, WhatsApp ou qualquer disparo automático.
- **Por que existe:** é o requisito central do produto (`doc/requisitos.md` §2.3) — mas o disparo efetivo foi explicitamente adiado pelo usuário para o final do roadmap, porque ainda não foi decidido se o canal será e-mail, WhatsApp ou outro. Agendar sem disparar já entrega valor real: a nutricionista vê, numa lista, quando cada questionário "vence" e providencia o envio manualmente por fora do sistema enquanto isso.
- **Quem usa:** a nutricionista, na tela de Envios e no perfil do paciente.
- **Escopo:** criar, listar e cancelar agendamentos. Cálculo automático da data prevista. Cancelamento em cascata quando o paciente vira inativo.
- **Fora de escopo neste ciclo (decisão do usuário, ver DR-013/DR-014):** geração de link/token, envio real ou simulado de e-mail/WhatsApp, tela pública de resposta, recorrência (repetir automaticamente), reenvio automático por não resposta. Tudo isso fica para o **último** ciclo do roadmap, quando o canal de disparo for escolhido.

---

## 2. Análise dos Documentos de Referência

- **requisitos.md** §2.3 (agendamento) e §2.2 (Histórico de Consultas, usado como referência temporal).
- **DDR:** DR-004 (agendamento relativo/fixo/recorrência — parcialmente aplicada aqui, recorrência adiada), DR-005 (link — adiado para o ciclo de disparo), DR-006 (canais — campo mantido só como metadado por ora), DR-013/DR-014 (novas, ver abaixo).
- **Código lido:** `src/types/index.ts` (tipos `Envio`/`CanalEnvio`/`TipoAgendamento`/`StatusEnvio` já existiam como código morto), `src/app/api/pacientes/route.ts`, `src/app/api/questionarios/route.ts`, `src/app/api/perguntas/route.ts` (padrão de listagem paginada com filtros), `src/app/api/pacientes/[id]/route.ts` (PUT, para o hook de cancelamento em cascata), `src/app/api/pacientes/[id]/consultas/route.ts` (para reaproveitar "última consulta"), `src/lib/formatters.ts`, `src/components/pacientes/PatientForm.tsx` (padrão de `Select` com `register`).

---

## 3. História de Usuário

```
Como nutricionista,
quero agendar quando um questionário de acompanhamento deveria ser enviado a um paciente,
para saber, numa lista, quando cada um "vence" e providenciar o envio por fora enquanto o disparo automático não existe.
```

**Cenários alternativos:**
- Paciente ou questionário não está ativo → agendamento bloqueado.
- Referência "última consulta" escolhida sem nenhuma consulta registrada → bloqueado com mensagem clara.
- Paciente muda para inativo com agendamentos pendentes → todos são cancelados automaticamente.
- Data prevista já passou e o agendamento continua "agendado" → aparece como "atrasado" na listagem (calculado, não persistido).

---

## 4. Requisitos Funcionais

- [ ] RF-44: A nutricionista cria um agendamento vinculando um paciente **ativo** e um questionário **ativo**.
- [ ] RF-45: Em agendamento do tipo "relativo", o sistema calcula `dataEnvioPrevista` somando os dias informados à data de referência escolhida (cadastro do paciente ou última consulta).
- [ ] RF-46: Agendamento com referência "última consulta" é bloqueado, com mensagem explicativa, se o paciente não tiver nenhuma consulta registrada.
- [ ] RF-47: Em agendamento do tipo "data fixa", `dataEnvioPrevista` é a data informada diretamente.
- [ ] RF-48: A nutricionista visualiza a listagem de agendamentos (paciente, questionário, canal, data prevista, status), com "agendado" vencido exibido como "atrasado".
- [ ] RF-49: A nutricionista cancela um agendamento (`status` vira `cancelado`; o registro permanece no histórico, sem soft delete).
- [ ] RF-50: Ao mudar o status de um paciente para `inativo`, todos os agendamentos `agendado` desse paciente são automaticamente cancelados.
- [ ] RF-51: O perfil do paciente exibe, na aba "Questionários", os agendamentos vinculados àquele paciente, com atalho para criar um novo.

---

## 5. Requisitos Não Funcionais

- **Segurança:** todas as rotas exigem autenticação; um agendamento só é acessível pela nutricionista dona do paciente e do questionário envolvidos.
- **Persistência:** `src/data/envios.json`, mesmo padrão file-based do restante do sistema.
- **Observabilidade:** erros logados via `console.error("[envios ...]", e)`.

### 5.1 UI/UX Responsivo

- Formulário de agendamento e listagem seguem os mesmos breakpoints já usados (375px, 768px, 1440px) — layout empilhado em mobile, grid em telas maiores, sem scroll horizontal.

### 5.2 Componentização e Reusabilidade

- `EnvioList` é usada em dois contextos (tela `/envios`, com todos os pacientes, e a aba "Questionários" do perfil do paciente, só daquele paciente) — recebe `showPaciente?: boolean` (default `true`) em vez de duas listas hardcoded diferentes.
- `calcularDataEnvioPrevista` e `getUltimaConsulta` (novo `src/lib/envios.ts`) são funções puras reaproveitáveis — a mesma lógica de "data de referência" será necessária de novo no ciclo de disparo/recorrência futuro.

---

## 6. Análise da Aplicação

- Mesmo padrão das features anteriores: rota de API lê/escreve a coleção JSON diretamente, Zod valida a entrada, React Hook Form conduz os formulários.
- Listagens paginadas existentes (`pacientes`, `questionarios`, `perguntas`) sempre acumulam `q`, `status`, `page`, `pageSize` como query params e retornam `{ data, total, page, pageSize, totalPages }` — os selects de paciente/questionário no formulário de agendamento reaproveitam esses endpoints existentes (`GET /api/pacientes?status=ativo&pageSize=50`, `GET /api/questionarios?status=ativo&pageSize=50`), sem precisar de endpoints novos para isso.
- `perguntaSchema` já mostra o padrão de `z.object({...}).superRefine(...)` para validação condicional por tipo — o novo `envioSchema` segue o mesmo padrão (e, diferente de `perguntaUpdateSchema`, **não** chama `.partial()` nele, evitando repetir o bug corrigido em `26998d1`).

---

## 7. Arquivos Envolvidos

| Arquivo | Ação | Razão |
|---|---|---|
| `src/types/index.ts` | Modificar | Simplificar `TipoAgendamento` para `"relativo" \| "data_fixa"`, `StatusEnvio` para `"agendado" \| "cancelado"`, adicionar `ReferenciaRelativa`, e remover de `Envio` os campos que só fazem sentido com disparo real (`dataEnvioEfetiva`, `token`, `respondidoEm`) |
| `src/lib/validations/envio.ts` | Criar | `envioSchema` com validação condicional por `tipoAgendamento` |
| `src/lib/envios.ts` | Criar | `getUltimaConsulta(pacienteId)` e `calcularDataEnvioPrevista(...)` |
| `src/app/api/envios/route.ts` | Criar | `GET` (listar, filtros `pacienteId`/`status`) e `POST` (criar agendamento) |
| `src/app/api/envios/[id]/route.ts` | Criar | `DELETE` (cancelar — muda `status`, não é soft delete) |
| `src/app/api/pacientes/[id]/route.ts` | Modificar | No `PUT`, após persistir, cancelar em cascata os envios `agendado` do paciente se o novo `status` for `inativo` |
| `src/components/envios/EnvioForm.tsx` | Criar | Formulário de agendamento (paciente, questionário, canal, tipo + campos condicionais) |
| `src/components/envios/EnvioList.tsx` | Criar | Lista reutilizável, com `showPaciente?: boolean` |
| `src/app/envios/page.tsx` | Criar | Listagem geral com filtro de status e link para novo agendamento |
| `src/app/envios/novo/page.tsx` | Criar | Formulário de novo agendamento; aceita `?pacienteId=` via query string para pré-selecionar |
| `src/app/pacientes/[id]/page.tsx` | Modificar | Aba "Questionários" passa a exibir `EnvioList` (`showPaciente={false}`) do paciente + botão "Agendar questionário" linkando para `/envios/novo?pacienteId=...` |

---

## 8. Problemas e Impedimentos

### 8.1 Problemas Técnicos
Nenhum identificado — reaproveita padrões já validados nas features anteriores.

### 8.2 Ambiguidades nos Requisitos
Nenhuma — o escopo foi deliberadamente reduzido durante o brainstorming (sem disparo, sem recorrência, sem link) para eliminar justamente as ambiguidades que dependiam de uma decisão de canal ainda não tomada.

### 8.3 Riscos
- Baixo: a única mudança em código existente fora dos arquivos novos é o hook de cancelamento em cascata em `src/app/api/pacientes/[id]/route.ts` e a substituição do placeholder na aba "Questionários" — ambos isolados e cobertos pelos critérios de aceite abaixo.

---

## 9. Critérios de Aceite

- [ ] CA-28: Dado paciente cadastrado em 01/08/2026, quando agendado "relativo, 7 dias, referência cadastro", então `dataEnvioPrevista` = 08/08/2026.
- [ ] CA-29: Dado paciente com última consulta em 10/08/2026, quando agendado "relativo, 5 dias, referência última consulta", então `dataEnvioPrevista` = 15/08/2026.
- [ ] CA-30: Dado paciente sem nenhuma consulta registrada, quando a nutricionista tenta agendar com referência "última consulta", então o agendamento é bloqueado com mensagem explicativa.
- [ ] CA-31: Dado agendamento "data fixa" = 20/09/2026, quando salvo, então `dataEnvioPrevista` = 20/09/2026.
- [ ] CA-32: Dado um agendamento `agendado` com `dataEnvioPrevista` no passado, quando a nutricionista visualiza a listagem, então ele aparece com o rótulo "Atrasado".
- [ ] CA-33: Dado um agendamento existente, quando a nutricionista o cancela, então `status` vira `cancelado` e ele deixa de aparecer na listagem padrão (filtrável por status "todos").
- [ ] CA-34: Dado um paciente com 2 agendamentos `agendado`, quando seu status muda para `inativo`, então ambos os agendamentos passam a `cancelado`.
- [ ] CA-35 (responsividade): Em 375px, 768px e 1440px, a listagem e o formulário de agendamento não quebram e todos os botões permanecem clicáveis.

---

## 10. Plano de Implementação (Passo a Passo)

```
Passo 1: Ajustar tipos e criar validação
  - O que fazer: simplificar TipoAgendamento/StatusEnvio/Envio em src/types/index.ts; criar envioSchema em src/lib/validations/envio.ts
  - Arquivo(s): src/types/index.ts, src/lib/validations/envio.ts
  - Como validar: `npm run build` sem erros

Passo 2: Criar helpers de cálculo
  - O que fazer: getUltimaConsulta e calcularDataEnvioPrevista em src/lib/envios.ts
  - Arquivo(s): src/lib/envios.ts
  - Como validar: `npm run build` sem erros (funções puras, sem I/O de rede)

Passo 3: Criar backend de envios (listar/criar)
  - O que fazer: GET (filtros pacienteId/status, enriquecido com nome do paciente e título do questionário) e POST (valida paciente/questionário ativos, calcula dataEnvioPrevista, bloqueia referência sem consulta)
  - Arquivo(s): src/app/api/envios/route.ts
  - Como validar: criar agendamento de cada tipo via requisição HTTP autenticada; validar bloqueios (paciente inativo, questionário inativo, referência sem consulta)

Passo 4: Criar backend de cancelamento
  - O que fazer: DELETE muda status para cancelado (sem soft delete)
  - Arquivo(s): src/app/api/envios/[id]/route.ts
  - Como validar: cancelar via requisição HTTP; listagem padrão não mostra mais o item

Passo 5: Cancelamento em cascata
  - O que fazer: no PUT de pacientes/[id], após salvar, se status novo for inativo, cancelar todos os envios agendados desse paciente
  - Arquivo(s): src/app/api/pacientes/[id]/route.ts
  - Como validar: criar 2 agendamentos para um paciente, mudar status do paciente para inativo, conferir que ambos viram cancelado

Passo 6: Criar formulário de agendamento
  - O que fazer: EnvioForm com paciente/questionário (selects carregados via fetch), tipo de agendamento e campos condicionais
  - Arquivo(s): src/components/envios/EnvioForm.tsx
  - Como validar: `npm run build` sem erros

Passo 7: Criar listagem reutilizável
  - O que fazer: EnvioList com showPaciente?: boolean
  - Arquivo(s): src/components/envios/EnvioList.tsx
  - Como validar: `npm run build` sem erros

Passo 8: Criar telas /envios e /envios/novo
  - O que fazer: listagem geral com filtro de status; formulário de novo agendamento aceitando ?pacienteId= para pré-seleção
  - Arquivo(s): src/app/envios/page.tsx, src/app/envios/novo/page.tsx
  - Como validar: fluxo completo pela tela — criar, listar, cancelar

Passo 9: Integrar na aba Questionários do perfil do paciente
  - O que fazer: substituir o placeholder por EnvioList (showPaciente=false) + botão "Agendar questionário"
  - Arquivo(s): src/app/pacientes/[id]/page.tsx
  - Como validar: perfil do paciente mostra os agendamentos dele; botão leva ao formulário com paciente pré-selecionado

Passo 10: Verificar todos os critérios de aceite e responsividade
  - Arquivo(s): todos os acima
  - Como validar: CA-28 a CA-35 manualmente
```

---

## 11. Rollout e Observabilidade

- **Estratégia de entrega:** deploy direto, sem flag.
- **Como monitorar:** logs de erro no console do servidor.
- **Plano de rollback:** reverter o commit; nenhuma migração destrutiva (coleção nova).

---

## 12. Definição de Pronto (DoD)

- [ ] Critérios de aceite CA-28 a CA-35 verificados
- [ ] `npm run build` sem erros/warnings novos
- [ ] Nenhuma chamada de rede externa, geração de token ou disparo de qualquer tipo introduzida neste ciclo
- [ ] Aba "Questionários" e tela `/envios` testadas nos 3 breakpoints
- [ ] `doc/requisitos.md`, DDR (DR-013/DR-014) e `doc/plano-implantacao.md` atualizados com a nova ordem do roadmap (disparo efetivo movido para o final)

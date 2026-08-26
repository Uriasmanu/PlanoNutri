# Plano de Implementação por Versões — PlanoNutri

**Escopo:** Funcionalidades internas do sistema (nutricionista).
**Fora de escopo (decisão futura):** Envio de questionário ao paciente, formulário público, canais de envio (e-mail, WhatsApp, QR Code, SMS), geração de token de acesso, reenvio automático.

**Documentos de referência:** `requisitos.md`, `DDR — Design Decision Record.md`, `Design System Documentation.md`, `spec.md`

---

## Visão Geral das Versões

| Versão | Foco | Dependências |
|---|---|---|
| **v0.1** | Infraestrutura base + autenticação | Nenhuma |
| **v0.2** | Cadastro completo de pacientes | v0.1 |
| **v0.3** | Banco de perguntas + criação de questionários | v0.1 |
| **v0.4** | Agendamento de envio (config, sem envio efetivo) | v0.2, v0.3 |
| **v0.5** | Dashboard + acompanhamento de respostas | v0.2, v0.3, v0.4 |
| **v0.6** | Refinamento, testes e preparo para envio | Todas |

---

## v0.1 — Infraestrutura Base + Autenticação

**Objetivo:** Ter o sistema rodando com login funcional, design system aplicado e estrutura de pastas pronta.

### Funcionalidades

- Cadastro e login da nutricionista (único perfil de usuário — DR-002)
- Autenticação via JWT com Refresh Token
- Proteção de rotas (middleware de auth)
- Layout base: sidebar/header responsivo (mobile: hamburguer, desktop: sidebar)
- Tema light/dark com tokens do Design System
- Inicialização do banco de dados com migration da tabela `usuarios`

### DDRs Relacionados

- **DR-002** — Perfil único de usuário (nutricionista)
- **DR-008** — Dados sensíveis (LGPD) — criptografia em repouso, HTTPS

### Telas

| Tela | Descrição |
|---|---|
| Login | Formulário de e-mail + senha com validação |
| Layout autenticado | Sidebar (desktop) / menu hamburguer (mobile) com navegação |

### Requisitos Funcionais

- [ ] RF-01: O sistema exige autenticação para acessar qualquer rota autenticada
- [ ] RF-02: A nutricionista se autentica com e-mail e senha
- [ ] RF-03: O token JWT expira após tempo definido e é renovado via refresh token
- [ ] RF-04: Rotas autenticadas retornam 401 quando o token é inválido/expirado
- [ ] RF-05: O layout adapta-se entre mobile (hamburguer) e desktop (sidebar)

### Critérios de Aceite

- [ ] CA-01: Dado e-mail e senha válidos, quando a nutricionista clica em "Entrar", então ela é redirecionada para o dashboard
- [ ] CA-02: Dado token expirado, quando a nutricionista acessa uma rota, então o sistema redireciona para o login
- [ ] CA-03: Dado acesso via mobile (375px), quando a nutricionista visualiza o menu, então o menu hamburguer é exibido corretamente
- [ ] CA-04: Dado acesso via desktop (1440px), quando a nutricionista visualiza o menu, então a sidebar é exibida com todas as opções

### Passos de Implementação

```
Passo 1: Configurar projeto Next.js + Tailwind + shadcn/ui
  - O que fazer: inicializar projeto, instalar dependências (shadcn, tailwind, zod, react-hook-form)
  - Arquivo(s): package.json, tailwind.config.ts, globals.css
  - Como validar: `npm run dev` sem erros

Passo 2: Configurar tema do Design System
  - O que fazer: definir CSS variables (cores, tipografia) conforme Design System Documentation
  - Arquivo(s): app/globals.css, lib/utils.ts
  - Como validar: componentes shadcn/ui renderizam com cores corretas

Passo 3: Criar migration de usuarios
  - O que fazer: tabela usuarios com campos id, email, nome, senha_hash, created_at, updated_at
  - Arquivo(s): migrations/ (a confirmar stack)
  - Como validar: migration roda sem erros

Passo 4: Criar backend de autenticação
  - O que fazer: endpoints POST /auth/login, POST /auth/refresh, POST /auth/logout; hash de senha com bcrypt; geração de JWT
  - Arquivo(s): controllers/auth, services/auth, repositories/auth (a confirmar estrutura)
  - Como validar: login retorna token; token expirado retorna 401

Passo 5: Criar frontend de login
  - O que fazer: formulário com React Hook Form + Zod, chamada à API, armazenamento do token
  - Arquivo(s): app/login/page.tsx, components/forms/LoginForm.tsx
  - Como validar: login com credenciais válidas redireciona para /

Passo 6: Criar layout autenticado
  - O que fazer: sidebar responsiva com navegação, proteção de rotas via middleware
  - Arquivo(s): components/layout/Sidebar.tsx, components/layout/Header.tsx, middleware.ts
  - Como validar: rotas /pacientes, /questionarios retornam 401 sem token

Passo 7: Criar dashboard placeholder
  - O que fazer: tela vazia com "Bem-vinda, {nome}" para servir como landing page autenticada
  - Arquivo(s): app/page.tsx
  - Como validar: após login, dashboard é exibida
```

---

## v0.2 — Cadastro Completo de Pacientes

**Objetivo:** Nutricionista consegue cadastrar, listar, editar e gerenciar pacientes com todos os dados clínicos.

### Funcionalidades

- Listagem de pacientes com busca e filtros (nome, status)
- Cadastro de paciente com todos os campos do requisito (2.1)
- Edição de dados do paciente
- Exclusão com confirmação (soft delete — DR-008)
- Status do paciente: ativo, inativo, em pausa
- Histórico de evolução física (peso, medidas ao longo do tempo — gráfico com Recharts)
- Registro de evolução: adicionar novas medições ao longo do tempo

### DDRs Relacionados

- **DR-002** — Perfil único: `paciente.nutricionista_id` desde o início
- **DR-008** — LGPD: soft delete, criptografia de dados sensíveis

### Modelos de Dados

```
Paciente
├── id (UUID)
├── nutricionista_id (FK → usuarios)
├── nome_completo
├── data_nascimento
├── sexo (enum: M, F, Outro)
├── telefone
├── email
├── peso_inicial (decimal)
├── altura (decimal)
├── percentual_gordura (decimal, nullable)
├── circunferencia_cintura (decimal, nullable)
├── circunferencia_quadril (decimal, nullable)
├── circunferencia_braco (decimal, nullable)
├── objetivo (enum: emagrecimento, hipertrofia, reeducacao_alimentar, controle_doenca)
├── restricoes_alimentares (text)
├── historico_clinico (text)
├── nivel_atividade_fisica (enum: sedentario, leve, moderado, intenso)
├── observacoes (text, nullable)
├── status (enum: ativo, inativo, em_pausa)
├── created_at
├── updated_at
└── deleted_at (nullable — soft delete)

EvolucaoFisica
├── id (UUID)
├── paciente_id (FK → pacientes)
├── data_avaliacao
├── peso (decimal)
├── percentual_gordura (decimal, nullable)
├── circunferencia_cintura (decimal, nullable)
├── circunferencia_quadril (decimal, nullable)
├── circunferencia_braco (decimal, nullable)
├── observacoes (text, nullable)
└── created_at
```

### Telas

| Tela | Descrição |
|---|---|
| Listagem de Pacientes | Tabela com busca, filtros e paginação |
| Cadastro de Paciente | Formulário completo com todos os campos |
| Perfil do Paciente | Abas: dados pessoais, evolução física, questionários vinculados |

### Requisitos Funcionais

- [ ] RF-06: O sistema exibe lista de pacientes com busca por nome e filtro por status
- [ ] RF-07: A nutricionista cadastra um paciente com todos os campos obrigatórios
- [ ] RF-08: O sistema valida campos obrigatórios antes de salvar
- [ ] RF-09: A nutricionista edita dados de um paciente existente
- [ ] RF-10: A exclusão de paciente requer confirmação e é realizada via soft delete
- [ ] RF-11: O sistema registra evolução física (peso, medidas) com data
- [ ] RF-12: O sistema exibe gráfico de evolução de peso ao longo do tempo
- [ ] RF-13: Pacientes inativos não aparecem na listagem padrão (podem ser filtrados)

### Critérios de Aceite

- [ ] CA-05: Dado um paciente com 5 registros de evolução, quando a nutricionista acessa o perfil, então o gráfico de peso exibe 5 pontos ao longo do tempo
- [ ] CA-06: Dado um paciente ativo, quando a nutricionista muda seu status para "inativo", então o paciente não aparece na listagem padrão
- [ ] CA-07: Dado tentativa de cadastro sem nome, quando a nutricionista clica em salvar, então mensagem de erro é exibida no campo nome
- [ ] CA-08: Dado exclusão de paciente, quando a nutricionista confirma, então o paciente recebe `deleted_at` e não aparece nas consultas normais

### Passos de Implementação

```
Passo 1: Criar migrations de pacientes e evolucao_fisica
  - O que fazer: tabelas conforme modelos de dados acima
  - Arquivo(s): migrations/
  - Como validar: migrations rodam sem erros

Passo 2: Criar backend de pacientes
  - O que fazer: CRUD completo — endpoints GET/POST/PUT/DELETE, soft delete, filtros
  - Arquivo(s): controllers/pacientes, services/pacientes, repositories/pacientes
  - Como validar: CRUD testável via Thunder Client/Postman

Passo 3: Criar listagem de pacientes
  - O que fazer: tabela com busca, filtros, paginação, status badge
  - Arquivo(s): app/pacientes/page.tsx, components/pacientes/PatientTable.tsx
  - Como validar: lista exibe pacientes, busca filtra, paginação funciona

Passo 4: Criar formulário de cadastro/edição
  - O que fazer: formulário completo com React Hook Form + Zod, validação
  - Arquivo(s): components/pacientes/PatientForm.tsx
  - Como validar: cadastro com todos os campos obrigatórios funciona

Passo 5: Criar perfil do paciente com abas
  - O que fazer: tabs (dados, evolução, questionários), exibição de dados
  - Arquivo(s): app/pacientes/[id]/page.tsx, components/pacientes/PatientProfile.tsx
  - Como validar: perfil exibe dados corretos, abas navegam

Passo 6: Criar registro e gráfico de evolução
  - O que fazer: formulário de nova medição + gráfico Recharts de peso
  - Arquivo(s): components/pacientes/EvolutionChart.tsx, components/pacientes/EvolutionForm.tsx
  - Como validar: adicionar medição aparece no gráfico

Passo 7: Criar exclusão com confirmação
  - O que fazer: modal de confirmação antes de soft delete
  - Arquivo(s): components/pacientes/DeletePatientDialog.tsx
  - Como validar: excluir paciente pede confirmação e registra deleted_at
```

---

## v0.3 — Banco de Perguntas + Criação de Questionários

**Objetivo:** Nutricionista consegue montar um banco de perguntas reutilizáveis e criar questionários de acompanhamento.

### Funcionalidades

- Banco de perguntas reutilizável (DR-003)
- Tipos de resposta: texto livre, múltipla escolha, escala (1-5), numérico, sim/não
- CRUD de perguntas (criar, editar, listar)
- Criação de questionário: título, descrição, seleção de perguntas do banco
- Reordenação de perguntas dentro do questionário
- Perguntas sugeridas padrão (pré-cadastradas, customizáveis)
- Status do questionário: rascunho, ativo, inativo

### DDRs Relacionados

- **DR-003** — Banco de perguntas reutilizável com versionamento
- **DR-005** — (parcial) modelo de dados de questionário preparado para vincular com envios futuros

### Modelos de Dados

```
Pergunta
├── id (UUID)
├── nutricionista_id (FK → usuarios)
├── titulo (text — enunciado da pergunta)
├── tipo_resposta (enum: texto_livre, multipla_escolha, escala, numerico, sim_nao)
├── opcoes_resposta (JSON, nullable — para multipla_escolha: ["opcao1", "opcao2"])
├── escala_min (int, nullable — para escala, ex: 1)
├── escala_max (int, nullable — para escala, ex: 5)
├── obrigatoria (boolean, default true)
├── padrao (boolean — se é pergunta sugerida padrão do sistema)
├── created_at
├── updated_at
└── deleted_at (nullable)

Questionario
├── id (UUID)
├── nutricionista_id (FK → usuarios)
├── titulo (text)
├── descricao (text, nullable)
├── status (enum: rascunho, ativo, inativo)
├── created_at
├── updated_at
└── deleted_at (nullable)

QuestionarioPergunta
├── id (UUID)
├── questionario_id (FK → questionarios)
├── pergunta_id (FK → perguntas)
├── ordem (int)
└── created_at
```

### Telas

| Tela | Descrição |
|---|---|
| Banco de Perguntas | Listagem com busca, criação e edição de perguntas |
| Criar/Editar Questionário | Formulário com título, descrição e seleção de perguntas |

### Requisitos Funcionais

- [ ] RF-14: A nutricionista cria perguntas com tipo de resposta definido
- [ ] RF-15: O sistema pré-cadastra perguntas sugeridas padrão (adesão, sintomas, peso, sono, etc.)
- [ ] RF-16: A nutricionista edita perguntas já criadas (sem alterar perguntas já respondidas — DR-003)
- [ ] RF-17: A nutricionista cria um questionário selecionando perguntas do banco
- [ ] RF-18: A nutricionista reordena perguntas dentro de um questionário
- [ ] RF-19: O questionário pode ficar em rascunho até ser publicado (status ativo)
- [ ] RF-20: Perguntas padrão do sistema não podem ser excluídas

### Critérios de Aceite

- [ ] CA-09: Dado uma pergunta tipo "escala" com min=1 e max=5, quando exibida no questionário, então slider de 1 a 5 é renderizado
- [ ] CA-10: Dado uma pergunta tipo "múltipla escolha" com 3 opções, quando exibida, então as 3 opções são apresentadas como radio buttons
- [ ] CA-11: Dado um questionário com 5 perguntas, quando a nutricionista reordena, então a ordem é persistida e refletida na exibição
- [ ] CA-12: Dado uma pergunta padrão do sistema, quando a nutricionista tenta excluir, então a ação é bloqueada com mensagem informativa

### Passos de Implementação

```
Passo 1: Criar migrations de perguntas, questionarios e questionario_perguntas
  - O que fazer: tabelas conforme modelos de dados acima
  - Arquivo(s): migrations/
  - Como validar: migrations rodam sem erros

Passo 2: Cadastrar perguntas sugeridas padrão
  - O que fazer: seed com perguntas: adesão, dificuldades, sintomas, peso, energia, sono, evacuação, atividade física
  - Arquivo(s): seeds/ (ou migration de seed)
  - Como validar: perguntas padrão aparecem no banco de perguntas

Passo 3: Criar backend de perguntas
  - O que fazer: CRUD de perguntas com validação por tipo
  - Arquivo(s): controllers/perguntas, services/perguntas, repositories/perguntas
  - Como validar: CRUD testável via API

Passo 4: Criar backend de questionários
  - O que fazer: CRUD de questionários, vinculação com perguntas, reordenação
  - Arquivo(s): controllers/questionarios, services/questionarios, repositories/questionarios
  - Como validar: criar questionário com perguntas vinculadas funciona

Passo 5: Criar tela de banco de perguntas
  - O que fazer: listagem, formulário de criação/edição com tipos de resposta dinâmicos
  - Arquivo(s): app/questionarios/banco-perguntas/page.tsx, components/questionnaires/QuestionBank.tsx
  - Como validar: criar pergunta de cada tipo funciona

Passo 6: Criar tela de criação de questionário
  - O que fazer: formulário com seleção de perguntas, drag para reordenação, preview
  - Arquivo(s): app/questionarios/novo/page.tsx, components/questionnaires/QuestionnaireBuilder.tsx
  - Como validar: montar questionário com 3+ perguntas e salvar funciona

Passo 7: Criar listagem de questionários
  - O que fazer: tabela com status, ações (editar, excluir, ativar/desativar)
  - Arquivo(s): app/questionarios/page.tsx, components/questionnaires/QuestionnaireList.tsx
  - Como validar: listar questionários com filtros por status
```

---

## v0.4 — Agendamento de Envio (Configuração, sem Envio Efetivo)

**Objetivo:** Nutricionista configura quando e para quem os questionários devem ser enviados, mas o envio em si não é executado (futuro).

### Funcionalidades

- Vinculação de questionário a paciente
- Configuração de agendamento (DR-004):
  - Prazo relativo (ex: "7 dias após cadastro", "2 meses após última consulta")
  - Data fixa específica
  - Recorrência (ex: a cada 15 dias)
- Pré-visualização de envios agendados
- Entidade "Envio" criada com campo de canal preparado (DR-006: `email | whatsapp_manual | whatsapp_api | qrcode | sms`)
- Status do envio: agendado, pendente_envio, enviado, respondido, atrasado, cancelado

### DDRs Relacionados

- **DR-004** — Agendamento com prazo relativo, data fixa ou recorrência
- **DR-005** — Token de acesso (será gerado futuramente, modelagem preparada)
- **DR-006** — Campo de canal preparado mesmo sem envio implementado

### Modelos de Dados

```
Envio
├── id (UUID)
├── nutricionista_id (FK → usuarios)
├── paciente_id (FK → pacientes)
├── questionario_id (FK → questionarios)
├── canal (enum: email, whatsapp_manual, whatsapp_api, qrcode, sms) — preparado, não utilizado ainda
├── tipo_agendamento (enum: relativo, data_fixa, recorrencia)
├── configuracao_agendamento (JSON — ex: { "dias": 7, "ref": "cadastro" } ou { "data": "2026-09-15" } ou { "intervalo_dias": 15 })
├── data_envio_prevista (date)
├── data_envio_efetiva (date, nullable)
├── status (enum: agendado, pendente_envio, enviado, respondido, atrasado, cancelado)
├── token (nullable — será gerado no momento do envio efetivo)
├── respondido_em (timestamp, nullable)
├── created_at
├── updated_at
└── deleted_at (nullable)
```

### Telas

| Tela | Descrição |
|---|---|
| Agendar Envio | Formulário: selecionar paciente, questionário, tipo de agendamento |
| Envios Agendados | Lista de envios futuros com status, paciente e data prevista |

### Requisitos Funcionais

- [ ] RF-21: A nutricionista vincula um questionário ativo a um paciente ativo
- [ ] RF-22: O sistema suporta três modos de agendamento: relativo, data fixa, recorrência
- [ ] RF-23: O sistema calcula a data de envio prevista com base no modo selecionado
- [ ] RF-24: Envios com paciente inativo são automaticamente cancelados
- [ ] RF-25: A nutricionista visualiza lista de envios agendados com status
- [ ] RF-26: A nutricionista cancela um envio agendado antes do envio efetivo

### Critérios de Aceite

- [ ] CA-13: Dado agendamento "7 dias após cadastro" para paciente cadastrado em 01/08/2026, quando salvo, então `data_envio_prevista` = 08/08/2026
- [ ] CA-14: Dado agendamento de recorrência a cada 15 dias, quando o paciente é marcado como inativo, então os envios futuros são cancelados
- [ ] CA-15: Dado envio agendado para 15/08/2026, quando a nutricionista cancela antes dessa data, então status muda para "cancelado"

### Passos de Implementação

```
Passo 1: Criar migration de envios
  - O que fazer: tabela conforme modelo de dados acima
  - Arquivo(s): migrations/
  - Como validar: migration roda sem erros

Passo 2: Criar backend de envios (agendamento)
  - O que fazer: criar envio, listar envios agendados, cancelar envio, cálculo de datas
  - Arquivo(s): controllers/envios, services/envios, repositories/envios
  - Como validar: criar envio com cada tipo de agendamento funciona

Passo 3: Criar tela de agendamento
  - O que fazer: formulário de seleção de paciente, questionário e configuração de agendamento
  - Arquivo(s): app/envios/novo/page.tsx, components/scheduling/ScheduleForm.tsx
  - Como validar: agendar envio com prazo relativo, data fixa e recorrência

Passo 4: Criar listagem de envios agendados
  - O que fazer: tabela com filtros por status, paciente, data
  - Arquivo(s): app/envios/page.tsx, components/scheduling/ScheduledSendList.tsx
  - Como validar: listar envios, cancelar envio funciona

Passo 5: Implementar cancelamento automático por status do paciente
  - O que fazer: ao mudar paciente para inativo, cancelar envios agendados futuros
  - Arquivo(s): services/pacientes (hook de status change)
  - Como validar: mudar status para inativo cancela envios pendentes
```

---

## v0.5 — Dashboard + Acompanhamento de Respostas

**Objetivo:** Nutricionista visualiza visão geral do sistema e respostas recebidas dos pacientes.

### Funcionalidades

- Dashboard com métricas:
  - Total de pacientes ativos
  - Questionários pendentes / respondidos / atrasados
  - Próximos envios agendados
- Painel de respostas:
  - Lista de questionários respondidos com status
  - Visualização das respostas do paciente
  - Histórico comparativo entre envios
- Alertas para respostas que indicam atenção (regra de negócio a definir — DDR pendente)

### DDRs Relacionados

- Nenhum DDR novo — usa decisões já documentadas

### Telas

| Tela | Descrição |
|---|---|
| Dashboard | Cards com métricas, lista de envios recentes, alertas |
| Respostas | Lista de respostas recebidas com detalhes |
| Detalhe da Resposta | Respostas completas do paciente ao questionário |

### Modelos de Dados

```
Resposta
├── id (UUID)
├── envio_id (FK → envios)
├── paciente_id (FK → pacientes)
├── questionario_id (FK → questionarios)
├── respondido_em (timestamp)
├── created_at
└── deleted_at (nullable)

RespostaItem
├── id (UUID)
├── resposta_id (FK → respostas)
├── pergunta_id (FK → perguntas)
├── valor_texto (text, nullable)
├── valor_numerico (decimal, nullable)
├── valor_sim_nao (boolean, nullable)
├── valor_opcao (text, nullable — para múltipla escolha)
├── valor_escala (int, nullable)
└── created_at
```

### Requisitos Funcionais

- [ ] RF-27: O dashboard exibe total de pacientes ativos
- [ ] RF-28: O dashboard exibe contagem de questionários por status (pendente, respondido, atrasado)
- [ ] RF-29: O dashboard exibe próximos envios agendados (próximos 7 dias)
- [ ] RF-30: A nutricionista visualiza lista de respostas recebidas
- [ ] RF-31: A nutricionista visualiza respostas completas de um questionário respondido
- [ ] RF-32: O sistema compara respostas do mesmo questionário entre envios diferentes

### Critérios de Aceite

- [ ] CA-16: Dado 10 pacientes ativos e 3 questionários pendentes, quando a nutricionista acessa o dashboard, então as métricas corretas são exibidas
- [ ] CA-17: Dado questionário respondido, quando a nutricionista clica nele, então todas as respostas são exibidas com rótulos das perguntas
- [ ] CA-18: Dado mesmo questionário respondido 3 vezes, quando a nutricionista acessa o histórico, então comparação entre as 3 respostas é exibida

### Passos de Implementação

```
Passo 1: Criar migrations de respostas e resposta_itens
  - O que fazer: tabelas conforme modelos de dados acima
  - Arquivo(s): migrations/
  - Como validar: migrations rodam sem erros

Passo 2: Criar backend de respostas
  - O que fazer: endpoints para criar resposta (futuro formulário público), listar respostas, detalhar resposta
  - Arquivo(s): controllers/respostas, services/respostas, repositories/respostas
  - como validar: criar resposta via API e consultar funciona

Passo 3: Criar dashboard
  - O que fazer: cards de métricas, lista de envios recentes, alertas
  - Arquivo(s): app/page.tsx, components/dashboard/MetricsCards.tsx, components/dashboard/RecentSends.tsx
  - Como validar: dashboard exibe métricas reais

Passo 4: Criar listagem de respostas
  - O que fazer: tabela com paciente, questionário, data, status
  - Arquivo(s): app/respostas/page.tsx, components/responses/ResponseList.tsx
  - Como validar: listar respostas recebidas

Passo 5: Criar detalhe da resposta
  - O que fazer: exibição completa das respostas com rótulos
  - Arquivo(s): app/respostas/[id]/page.tsx, components/responses/ResponseDetail.tsx
  - Como validar: visualizar respostas completas

Passo 6: Criar comparação histórica
  - O que fazer: gráfico/tabela comparando respostas do mesmo questionário entre envios
  - Arquivo(s): components/responses/ResponseComparison.tsx
  - Como validar: comparar 2+ respostas do mesmo questionário
```

---

## v0.6 — Refinamento, Testes e Preparo para Envio

**Objetivo:** Consolidar tudo, aplicar tratamento de erros, testes, e preparar a entidade Envio para receber lógica de envio real.

### Funcionalidades

- Tratamento de erros global (error boundaries, toast de erros)
- Loading states em todas as listagens (Skeleton)
- Validação completa de todos os formulários
- Testes unitários dos services e repositories
- Testes de integração dos endpoints principais
- Testes E2E dos fluxos críticos (login → cadastrar paciente → criar questionário → agendar envio)
- Preparação da entidade Envio para lógica de envio:
  - Campo `token` pronto para geração futura
  - Campo `canal` pronto para seleção de canal
  - Campo `data_envio_efetiva` pronto para registro de envio real
- Documentação da API (OpenAPI/Swagger)

### Requisitos Funcionais

- [ ] RF-33: O sistema exibe loading skeleton enquanto dados são carregados
- [ ] RF-34: Erros de API são exibidos ao usuário via toast
- [ ] RF-35: Todos os formulários validam antes de enviar
- [ ] RF-36: A API possui documentação acessível em /docs

### Critérios de Aceite

- [ ] CA-19: Dado erro de conexão com API, quando a nutricionista realiza uma ação, então toast de erro é exibido com mensagem amigável
- [ ] CA-20: Dado listagem de pacientes, quando os dados estão carregando, então skeletons são exibidos no lugar das linhas
- [ ] CA-21: Dado fluxo completo (login → cadastrar paciente → criar questionário → agendar envio), quando executado, então todas as etapas funcionam sem erros

### Passos de Implementação

```
Passo 1: Adicionar error boundaries
  - O que fazer: wrapper global de erros com fallback UI
  - Arquivo(s): app/error.tsx, app/not-found.tsx
  - Como validar: forçar erro e verificar fallback

Passo 2: Adicionar loading states
  - O que fazer: skeletons em listagens e páginas
  - Arquivo(s): components/ui/Skeleton.tsx (shadcn), páginas
  - Como validar: navegar entre páginas mostra skeleton

Passo 3: Adicionar toast de erros global
  - O que fazer: interceptor de erro na API com toast
  - Arquivo(s): services/api.ts (interceptor)
  - Como validar: erro de API exibe toast

Passo 4: Escrever testes unitários
  - O que fazer: testes de services (cálculo de datas, validações)
  - Arquivo(s): tests/services/
  - Como validar: `npm run test` passa

Passo 5: Escrever testes de integração
  - O que fazer: testes dos endpoints principais
  - Arquivo(s): tests/api/
  - Como validar: testes passam

Passo 6: Configurar documentação da API
  - O que fazer: Swagger/OpenAPI com todas as rotas
  - Arquivo(s): app/api/docs/ ou configuração do framework
  - Como validar: /docs exibe documentação completa

Passo 7: Revisão final de acessibilidade
  - O que fazer: verificar contraste, foco, navegação por teclado em todas as telas
  - Arquivo(s): todos os componentes de UI
  - Como validar: checklist de acessibilidade WCAG 2.1 AA
```

---

## Mapa de Rastreabilidade

| Versão | Requisitos | DDRs | Telas |
|---|---|---|---|
| v0.1 | RF-01 a RF-05 | DR-002, DR-008 | Login, Layout |
| v0.2 | RF-06 a RF-13 | DR-002, DR-008 | Listagem, Cadastro, Perfil |
| v0.3 | RF-14 a RF-20 | DR-003, DR-005 | Banco de Perguntas, Questionário |
| v0.4 | RF-21 a RF-26 | DR-004, DR-005, DR-006 | Agendamento, Envios |
| v0.5 | RF-27 a RF-32 | — | Dashboard, Respostas |
| v0.6 | RF-33 a RF-36 | — | Todas (refinamento) |

---

## Decisões Pendentes (antes de implementar envio efetivo)

Estes pontos precisam de decisão antes de avançar para envio ao paciente:

1. **Stack tecnológica** — linguagem/framework de backend e frontend, banco de dados (DDR pendente)
2. **Política de expiração do link** — após resposta? após N dias? (DR-005)
3. **Estratégia de reenvio** — novo token por reenvio ou reaproveitamento? (DR-005)
4. **Regra de "resposta que indica atenção"** — limiares numéricos? palavras-chave? (DDR pendente)
5. **Mecanismo de job/scheduler** — infraestrutura para agendamento e recorrência (DR-004)
6. **Canal de envio inicial** — e-mail (MVP conforme DR-006) ou outro?
7. **Serviço de e-mail** — SendGrid, Resend, Amazon SES, outro?

---

> **Próximo passo:** definir stack tecnológica e criar spec de cada feature conforme `spec.md` antes de iniciar v0.1.

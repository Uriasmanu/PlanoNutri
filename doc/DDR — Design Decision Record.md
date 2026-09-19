# DDR — Design Decision Record
## Plataforma para Nutricionista

**Documento de origem:** requisitos.md
**Data:** Agosto/2026
**Status geral:** Em definição (pré-MVP)

---

## Como ler este documento

Cada registro (DR) documenta uma decisão de design/arquitetura, o contexto que a motivou, as alternativas consideradas, a justificativa da escolha e as consequências (trade-offs) aceitas. Decisões podem ser revisitadas — o histórico de mudança deve ser mantido, não apagado.

---

## DR-001 — Sistema sem login para o paciente

**Status:** Aceita

**Contexto:**
O sistema precisa coletar respostas periódicas de pacientes sem gerar fricção de cadastro, já que os pacientes não são usuários recorrentes do sistema — apenas respondem questionários pontuais.

**Decisão:**
Não haverá autenticação nem área logada para o paciente. O paciente acessa o questionário por um link único, gerado por envio, vinculado a ele e àquele questionário específico.

**Alternativas consideradas:**
- Conta de paciente com login/senha — descartada por aumentar fricção e complexidade sem benefício claro no volume esperado (pequenas clínicas/autônomos).
- Autenticação por OTP/código a cada acesso — descartada como excesso de engenharia para o caso de uso atual; pode ser revisitada se houver abuso de links.

**Justificativa:**
Reduz a barreira de resposta (link direto, sem senha) e simplifica drasticamente o escopo do sistema, que passa a ter apenas um perfil de usuário autenticado (a nutricionista).

**Consequências:**
- O link se torna o único mecanismo de controle de acesso — precisa ser único, não previsível (token opaco) e idealmente de uso limitado no tempo/tentativas.
- Não há como o paciente recuperar um link perdido sem reenvio manual pela nutricionista.
- Risco de compartilhamento indevido do link deve ser mitigado por expiração e vínculo 1:1 com o envio (ver DR-005).

---

## DR-002 — Perfil único de usuário (nutricionista)

**Status:** Aceita

**Decisão:**
O sistema terá um único perfil autenticado: a nutricionista, responsável por cadastro de pacientes, criação/envio de questionários e acompanhamento de respostas.

**Alternativas consideradas:**
- Suporte a múltiplos profissionais/multi-tenant (clínica com várias nutricionistas) — descartado no MVP; documento já prevê "pequenas clínicas", mas escopo inicial trata como usuário único.

**Justificativa:**
Simplifica modelagem de permissões e dados no MVP. Multi-tenant pode ser adicionado depois sem quebrar o modelo de dados se o paciente já for tratado como entidade vinculada a um "profissional responsável".

**Consequências:**
- Se a evolução para multi-clínica for necessária, será preciso introduzir escopo de dados por profissional/organização — recomenda-se já modelar `paciente.nutricionista_id` desde o início para facilitar essa migração futura.

---

## DR-003 — Banco de perguntas reutilizável com tipos de resposta variados

**Status:** Aceita

**Contexto:**
Questionários de acompanhamento têm perguntas recorrentes (adesão, sintomas, peso, sono) que se repetem entre pacientes e entre envios.

**Decisão:**
Modelar perguntas como entidades reutilizáveis (banco de perguntas), com tipo de resposta definido por pergunta: texto livre, múltipla escolha, escala, numérico, sim/não. Questionários são composições dessas perguntas.

**Alternativas consideradas:**
- Perguntas "hardcoded" por questionário (sem reuso) — descartada por gerar duplicação e dificultar comparação histórica de respostas equivalentes entre envios.

**Justificativa:**
Permite comparação histórica de respostas (ex: evolução do nível de fome ao longo dos envios) e reduz retrabalho ao montar novos questionários.

**Consequências:**
- Exige modelagem mais cuidadosa (pergunta → tipo → opções de resposta → vínculo com questionário → resposta do paciente).
- Alterar uma pergunta já usada em envios passados exige política clara de versionamento (não editar pergunta "in place" se já respondida, para não corromper histórico).

---

## DR-004 — Agendamento de envio com prazo relativo, data fixa ou recorrência

**Status:** Aceita

**Decisão:**
O agendamento de questionários suporta três modos: prazo relativo (ex: "7 dias após o cadastro"), data fixa específica, e recorrência (ex: a cada 15 dias enquanto o paciente estiver ativo).

**Justificativa:**
Cobre os cenários reais de acompanhamento nutricional (pós-consulta, marcos fixos, acompanhamento contínuo) sem forçar a nutricionista a reagendar manualmente a cada envio.

**Consequências:**
- Requer um job/scheduler (worker assíncrono) que avalie periodicamente quais envios estão devidos — não pode ser resolvido só com lógica síncrona de request/response.
- Recorrência precisa ser interrompida automaticamente se o paciente mudar de status para inativo (dependência direta do cadastro de paciente).
- Reenvio automático por não resposta (X dias) é outra regra assíncrona que compartilha a mesma infraestrutura de agendamento — devem ser projetadas juntas.

---

## DR-005 — Link de questionário único, opaco e de uso controlado

**Status:** Aceita

**Contexto:**
Como não há login (DR-001), o link é o único mecanismo de acesso e de segurança dos dados de saúde do paciente (sensíveis sob LGPD).

**Decisão:**
Cada envio gera um token único e não sequencial (ex: UUID/token aleatório), vinculado a paciente + questionário + envio específico. O link não deve permitir reuso indevido nem enumeração.

**Justificativa:**
Dados de saúde exigem proteção mesmo sem autenticação tradicional — o token cumpre o papel de "capability" de acesso restrito.

**Consequências:**
- Necessário definir política de expiração (ex: expira após resposta, ou após N dias sem resposta) — não estava explícito no requisito e deve ser decidido antes da implementação.
- Reenvio automático (DR-004) implica gerar um novo link ou reativar o mesmo — decisão de produto pendente, recomenda-se novo token por reenvio para manter rastreabilidade de qual envio foi efetivamente respondido.

---

## DR-006 — Priorização de canais de envio: e-mail no MVP

**Status:** Aceita

**Contexto:**
O documento lista cinco canais possíveis (e-mail, link manual via WhatsApp, WhatsApp Business API, SMS, QR Code), com complexidade e custo muito diferentes entre si.

**Decisão:**
Fase 1 (MVP): e-mail transacional automático como canal único e obrigatório.
Fase 2: link direto via WhatsApp (geração de `wa.me/...` para envio manual pela nutricionista) e QR Code como reforço, sem custo adicional.
Fase 3 (opcional, condicionada a volume): WhatsApp Business API oficial via BSP.
SMS: descartado como prioridade — custo mais alto e baixa vantagem frente ao WhatsApp no Brasil.

**Alternativas consideradas:**
- Iniciar já com WhatsApp Business API — descartada para o MVP: exige aprovação de conta comercial e templates junto à Meta, contratação de BSP (Twilio, Z-API, 360dialog, Gupshup) e gera custo recorrente por conversa (R$ 0,05–R$ 0,50), incompatível com validar o produto antes de ter volume de pacientes.
- Priorizar SMS — descartada pelo custo por mensagem (R$ 0,10–R$ 0,30) ser mais alto que e-mail sem ganho de adesão relevante frente ao WhatsApp no contexto brasileiro.

**Justificativa:**
E-mail tem complexidade e custo baixos (SDKs prontos, faixa gratuita ampla) e é totalmente automatizável, cobrindo a funcionalidade essencial (envio + reenvio automático) sem dependência de homologação externa. Os demais canais são aditivos, não bloqueantes.

**Consequências:**
- No MVP, pacientes sem hábito de checar e-mail podem ter menor taxa de resposta — mitigado na Fase 2 pelo link manual via WhatsApp.
- A entidade "Envio" deve ser desenhada desde já com um campo de canal (`email | whatsapp_manual | whatsapp_api | qrcode | sms`), mesmo que só `email` esteja implementado, para não exigir retrabalho estrutural nas fases seguintes.
- Migrar para WhatsApp API no futuro exige orçamento recorrente e prazo de homologação — deve ser reavaliado apenas quando o volume de pacientes justificar (ver critério na Fase 3 do documento de requisitos).

---

## DR-007 — Cadastro de plano alimentar fora do escopo inicial

**Status:** Aceita

**Decisão:**
A funcionalidade de cadastro e envio de plano alimentar foi removida do escopo do MVP, permanecendo listada apenas como evolução futura.

**Justificativa:**
O foco do produto é centralizar cadastro de pacientes e acompanhamento pós-consulta via questionários — plano alimentar é uma funcionalidade adjacente com complexidade própria (edição de cardápios, substituições, PDF) que não é núcleo do problema a ser resolvido primeiro.

**Consequências:**
- O modelo de dados do paciente não precisa (por ora) prever estrutura de refeições/cardápio.
- Se essa evolução for priorizada depois, ela deve ser modelada como módulo separado, sem acoplar ao fluxo de questionários.

---

## DR-008 — Dados de saúde tratados como dados sensíveis (LGPD)

**Status:** Aceita

**Decisão:**
Todos os dados clínicos e físicos do paciente (histórico clínico, restrições alimentares, medidas, respostas de questionário) são tratados como dados sensíveis de saúde, exigindo controle de acesso restrito à nutricionista autenticada e criptografia dos dados sensíveis.

**Justificativa:**
Exigência legal (LGPD, art. 5º, II — dado pessoal sensível) e requisito não funcional explícito do documento de requisitos.

**Consequências:**
- Necessário criptografar campos sensíveis em repouso (não apenas em trânsito via HTTPS).
- Exclusão de dados de paciente não pode ser física/imediata — requer confirmação e possivelmente soft delete, para preservar histórico de acompanhamento (requisito de backup/histórico do documento).
- Como o link do questionário é a única "porta" pública do sistema (DR-001, DR-005), ele deve ser tratado como superfície de ataque prioritária em qualquer revisão de segurança.

---

## DR-009 — Histórico de Consultas como entidade mínima (data + tipo)

**Status:** Aceita

**Data:** Setembro/2026

**Contexto:**
O requisito de agendamento (DR-004) prevê prazo relativo "à última consulta", mas o sistema não tinha nenhum lugar para registrar quando as consultas aconteceram — só existia "Evolução Física" (peso/medidas), que não é a mesma coisa que o evento da consulta em si.

**Decisão:**
Criar a entidade `Consulta` (data + tipo: `primeira_consulta` | `retorno`) por paciente, independente da Evolução Física. Não registra orientação/plano passado nem medidas — isso continua fora de escopo (DR-007) ou pode ser revisitado depois.

**Alternativas consideradas:**
- Fundir Consulta com Evolução Física (registrar tudo junto) — descartada neste ciclo por exigir alterar uma feature já implementada (v0.2) sem necessidade imediata.
- Consulta completa com orientação/observações/próximos passos — descartada por enquanto (YAGNI); pode crescer depois se o uso real pedir.

**Justificativa:**
É o mínimo necessário para destravar o campo "última consulta" usado no agendamento de envio, sem reabrir o modelo de Evolução Física já em produção.

**Consequências:**
- "Última consulta" = `Consulta` não excluída com `dataConsulta` mais recente para aquele paciente.
- Se no futuro a nutricionista precisar registrar o que foi orientado em cada consulta, isso é uma extensão aditiva (novos campos), não uma quebra de modelo.

---

## DR-010 — Persistência permanece em JSON local; migração para banco adiada

**Status:** Aceita (decisão temporária, com revisão futura obrigatória)

**Data:** Setembro/2026

**Contexto:**
O deploy definitivo será em plataforma serverless (Vercel/Netlify), onde o filesystem é efêmero/somente leitura em produção — o padrão atual `src/lib/db.ts` com `src/data/*.json` não persiste dados de forma confiável nesse ambiente. A troca de banco (Firebase, cogitado) foi explicitamente adiada pelo usuário para depois.

**Decisão:**
Continuar desenvolvendo sobre JSON local por enquanto. A migração para um banco persistente (Firebase ou outro) é tratada como **requisito bloqueante antes de ativar envio real e recebimento de respostas em produção** — não antes disso.

**Alternativas consideradas:**
- Migrar agora para Postgres/Firebase — descartada: usuário priorizou continuar features sobre a base atual.

**Justificativa:**
Evita parar o desenvolvimento de funcionalidades para fazer uma migração de infraestrutura que só se torna estritamente necessária quando o sistema for de fato exercitado em produção (envio/recebimento real).

**Consequências:**
- Cadastro de pacientes, consultas, perguntas e questionários funcionam normalmente em desenvolvimento, mas **não devem ser considerados prontos para produção** até a migração.
- O ciclo de "Agendamento + Envio efetivo + Recebimento" (próximo após Histórico de Consultas) precisa reabrir esta decisão antes de ir ao ar de verdade.

---

## DR-011 — Envio efetivo via Resend + agendamento via Vercel Cron Jobs

**Status:** Aceita (recomendação para o próximo ciclo — ainda não implementada)

**Data:** Setembro/2026

**Contexto:**
DR-006 já definia e-mail como canal do MVP, mas não a implementação técnica de disparo nem de execução do agendamento/recorrência (DR-004 apontava a necessidade de um "job/scheduler" sem definir qual).

**Decisão:**
Usar **Resend** como provedor de e-mail transacional (SDK simples para Next.js, free tier compatível com o volume esperado) e **Vercel Cron Jobs** (nativo da plataforma de deploy já escolhida, sem custo/infra extra) para avaliar periodicamente quais `Envio` estão devidos e disparar o e-mail com o link único (token opaco, DR-005).

**Alternativas consideradas:**
- Fila/worker dedicado (Redis + BullMQ ou similar) — descartada por ser over-engineering para o volume esperado (pequenas clínicas/autônomos); adiciona infraestrutura a operar sem necessidade real ainda.
- SendGrid/Amazon SES — alternativas válidas, mas Resend foi priorizado pela integração mais simples com Next.js.

**Justificativa:**
Resolve o "Mecanismo de job/scheduler" (antes em aberto) e o disparo de e-mail com o menor custo operacional possível, usando recursos nativos da própria stack já adotada.

**Consequências:**
- Recebimento das respostas se dá por uma rota pública (`/responder/[token]`) que reaproveita os componentes de tipo de pergunta já existentes no banco de perguntas — sem duplicar lógica de renderização.
- Depende da migração de banco (DR-010) estar concluída antes de operar em produção, já que o Cron Job precisa ler/escrever de forma confiável entre execuções.

---

## DR-012 — Dashboard simplificado (lista, sem cards de métricas)

**Status:** Aceita

**Data:** Setembro/2026

**Contexto:**
O documento de requisitos original previa um dashboard com cards de métricas (total de pacientes ativos, questionários por status, próximos envios). O usuário pediu para manter o site simples, com foco principal em cadastro de paciente e envio de questionário.

**Decisão:**
O Dashboard vira uma lista objetiva (questionários pendentes/atrasados com link rápido para o paciente), sem cards de métricas agregadas.

**Justificativa:**
Cards de métricas agregam valor limitado para o volume esperado (poucos pacientes por nutricionista autônoma) e adicionam complexidade de cálculo/agregação que não é o foco do produto.

**Consequências:**
- Menos telas/componentes para manter.
- Se o volume de pacientes crescer e métricas agregadas fizerem falta, isso pode ser adicionado depois sem quebrar o modelo de dados.

---

## Decisões em aberto (não resolvidas pelo documento de requisitos)

Os pontos abaixo precisam de uma decisão explícita antes da implementação, pois o documento de requisitos não os define:

- Política de expiração/uso único do link de questionário (DR-005) — a definir quando o ciclo de Envio efetivo (DR-011) for implementado.
- Estratégia de reenvio automático: novo token por reenvio ou reaproveitamento do mesmo link.
- Definição de "resposta que indica atenção" para o alerta ao nutricionista (regra de negócio, ex: limiares numéricos ou palavras-chave em texto livre).
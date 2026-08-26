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

## Decisões em aberto (não resolvidas pelo documento de requisitos)

Os pontos abaixo precisam de uma decisão explícita antes da implementação, pois o documento de requisitos não os define:

- Stack tecnológica (linguagem/framework de backend, frontend, banco de dados) — ainda não especificada.
- Política de expiração/uso único do link de questionário (DR-005).
- Estratégia de reenvio automático: novo token por reenvio ou reaproveitamento do mesmo link.
- Definição de "resposta que indica atenção" para o alerta ao nutricionista (regra de negócio, ex: limiares numéricos ou palavras-chave em texto livre).
- Mecanismo de job/scheduler para agendamento e recorrência (DR-004) — infraestrutura ainda não escolhida.
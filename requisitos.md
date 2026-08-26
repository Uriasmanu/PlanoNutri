# Documento de Requisitos — Plataforma para Nutricionista

## 1. Visão Geral

Sistema web voltado para nutricionistas autônomos ou pequenas clínicas, permitindo o gerenciamento de pacientes e o acompanhamento periódico da evolução do paciente através de questionários com prazos personalizados.

**Objetivo principal:** centralizar o cadastro de pacientes e o acompanhamento pós-consulta em um único sistema, reduzindo o uso de planilhas e mensagens manuais via WhatsApp.

**Acesso ao sistema:** a plataforma é de uso exclusivo da nutricionista. Não há login ou área logada para o paciente — o paciente apenas recebe o link do questionário pelo canal escolhido (e-mail, WhatsApp etc.) e responde diretamente por esse link, sem necessidade de cadastro de acesso ou senha.

**Perfil de usuário:**
- **Nutricionista (único usuário do sistema):** cadastra pacientes, cria e envia questionários, acompanha respostas.

---

## 2. Funcionalidades

### 2.1 Cadastro de Paciente

**Descrição:** tela para o nutricionista cadastrar e gerenciar as informações dos pacientes.

**Campos sugeridos:**
- Dados pessoais: nome completo, data de nascimento, sexo, telefone, e-mail
- Dados físicos iniciais: peso, altura, percentual de gordura (se disponível), circunferências (cintura, quadril, braço)
- Objetivo do paciente: emagrecimento, hipertrofia, reeducação alimentar, controle de doença (diabetes, hipertensão, etc.)
- Restrições e alergias alimentares
- Histórico clínico relevante (doenças pré-existentes, uso de medicamentos)
- Nível de atividade física
- Observações gerais (campo livre)

**Funcionalidades da tela:**
- Listagem de pacientes com busca e filtros (nome, status ativo/inativo, data da última consulta)
- Edição e exclusão (com confirmação) de cadastro
- Histórico de evolução física (peso e medidas ao longo do tempo, idealmente com gráfico)
- Status do paciente: ativo, inativo, em pausa

**Requisitos não funcionais:**
- Dados sensíveis de saúde devem seguir boas práticas de proteção de dados (LGPD), com controle de acesso restrito à nutricionista

---

### 2.2 Questionário de Acompanhamento com Data Personalizada

**Descrição:** funcionalidade para o nutricionista criar e agendar o envio de questionários de acompanhamento, com prazo definido de forma flexível (ex: 1 semana, 2 meses, 15 dias) a partir do cadastro do paciente ou de uma data específica.

**Configuração do questionário:**
- Título e descrição do questionário
- Banco de perguntas reutilizável, com tipos de resposta variados:
  - Texto livre
  - Múltipla escolha
  - Escala (ex: de 1 a 5 — nível de fome, satisfação, adesão à orientação)
  - Numérico (ex: peso atual)
  - Sim/Não
- Perguntas sugeridas padrão (customizáveis): adesão às orientações, dificuldades encontradas, sintomas, peso atual, nível de energia, qualidade do sono, evacuação, prática de atividade física

**Agendamento de envio:**
- Definição da data/prazo de envio de forma flexível:
  - Prazo relativo (ex: "7 dias após o cadastro", "2 meses após a última consulta")
  - Data fixa específica
  - Recorrência (ex: enviar a cada 15 dias enquanto o paciente estiver ativo)
- Reenvio automático em caso de não resposta após X dias
- O paciente responde pelo link recebido, sem necessidade de login — o link é único e vinculado àquele paciente e àquele envio específico

**Canais de envio do questionário — opções, complexidade e custo:**

| Canal | Como funciona | Complexidade de implementação | Custo estimado |
|---|---|---|---|
| **E-mail** | Envio automático de link de acesso ao questionário via e-mail transacional | Baixa — serviços como SendGrid, Amazon SES, Resend ou Mailgun têm SDKs prontos e integração simples | Baixo — maioria dos provedores tem faixa gratuita (ex: até 3.000 envios/mês) e cobrança de poucos centavos por e-mail acima disso |
| **Link direto via WhatsApp (manual)** | Sistema gera o link do questionário e a nutricionista o envia manualmente pelo próprio WhatsApp | Muito baixa — apenas geração de um link (`wa.me/...`) com o link do questionário | Nenhum custo — não usa API paga, mas depende de ação manual da nutricionista |
| **WhatsApp via API oficial (Business API)** | Ver explicação detalhada abaixo | Alta | Médio a alto |
| **SMS** | Envio do link do questionário via mensagem de texto | Baixa a média — serviços como Twilio ou Zenvia têm integração simples via API | Médio — custo por SMS é mais alto que e-mail (em geral R$ 0,10 a R$ 0,30 por mensagem no Brasil) |
| **QR Code (impresso ou exibido no consultório)** | QR Code gerado apontando para o questionário, entregue no fim da consulta presencial | Muito baixa — apenas geração de QR Code a partir do link | Nenhum custo — geração de QR Code é gratuita (bibliotecas open source) |

#### Detalhamento: envio automático via WhatsApp (API oficial)

Essa opção permite que o sistema envie o questionário automaticamente no WhatsApp do paciente, sem qualquer ação manual da nutricionista — diferente do "link direto manual", que exige que ela mesma envie a mensagem.

**Como funciona na prática:**
1. **Conta comercial no WhatsApp:** é necessário criar uma conta no WhatsApp Business Platform (API oficial da Meta), vinculada a um número de telefone dedicado (não pode ser o número pessoal já usado no WhatsApp comum)
2. **Provedor intermediário (BSP):** a Meta normalmente não é acessada diretamente por sistemas pequenos — usa-se um provedor homologado (chamado de BSP, ex: Twilio, Z-API, 360dialog, Gupshup), que fornece a API e a infraestrutura de envio
3. **Aprovação de templates de mensagem:** toda mensagem automática enviada por iniciativa do sistema (fora de uma conversa iniciada pelo paciente) precisa ser um "template" pré-aprovado pela Meta — ex: "Olá {nome}, está na hora de responder seu questionário de acompanhamento: {link}". Não é possível enviar texto livre nesse tipo de envio
4. **Janela de conversa:** após o paciente responder ou interagir, abre-se uma janela de 24h em que é possível trocar mensagens livres; fora dela, é preciso usar novamente um template aprovado
5. **Integração técnica:** o sistema faz uma chamada de API para o provedor (BSP), informando o número do paciente, o template e as variáveis (nome, link do questionário); o provedor cuida do envio efetivo pelo WhatsApp
6. **Webhook de status:** o provedor pode notificar o sistema sobre o status da mensagem (entregue, lida, falhou), permitindo acompanhar se o paciente recebeu o questionário

**Por que a complexidade é alta:**
- Processo de aprovação de conta comercial e de número de telefone junto à Meta (pode levar dias)
- Aprovação de cada template de mensagem antes do uso
- Necessidade de integrar com um provedor terceiro (custo e configuração adicionais)
- Tratamento de regras específicas (janela de 24h, limites de envio, qualidade da conta)

**Por que o custo é médio/alto:**
- Cobrança por conversa iniciada pela empresa (varia por categoria e país — no Brasil, tende a ficar entre R$ 0,05 e R$ 0,50 por conversa)
- Mensalidade ou taxa de uso cobrada pelo provedor intermediário (BSP), que pode ter plano fixo mensal além do custo por mensagem
- Custo cresce proporcionalmente ao número de pacientes e à frequência de envio dos questionários

**Recomendação:** só compensa adotar essa opção quando o volume de pacientes justificar o investimento; para poucos pacientes, o custo e a complexidade de implementação/homologação não se pagam.

**Recomendação de priorização geral:**
- **Fase inicial (MVP):** e-mail automático — cobre a maior parte dos casos com baixo custo e baixa complexidade, e é totalmente automatizado pelo sistema
- **Fase intermediária:** link direto via WhatsApp manual (zero custo, alta adesão no Brasil) e QR Code para consultas presenciais, como reforço ao e-mail
- **Fase avançada (opcional):** WhatsApp via API oficial — só se justifica com volume alto de pacientes, pois envolve custo recorrente e maior complexidade de homologação; SMS costuma ser dispensável no Brasil dado o uso massivo do WhatsApp

**Acompanhamento das respostas:**
- Painel com status de cada questionário: pendente, respondido, atrasado
- Visualização das respostas do paciente, com histórico comparativo entre envios
- Alertas para o nutricionista quando houver respostas que indiquem atenção (ex: sintomas relatados, baixa adesão)

---

## 3. Requisitos Não Funcionais

- **Segurança e privacidade:** dados de saúde são sensíveis (LGPD); autenticação obrigatória para a nutricionista, criptografia de dados sensíveis; o link do questionário enviado ao paciente deve ser único, de uso limitado (evitar reuso/compartilhamento indevido) e sem exigir criação de conta
- **Responsividade:** acesso via desktop/mobile para a nutricionista, e formulário do questionário responsivo para o paciente (acessado por link, sem necessidade de instalar nada ou logar)
- **Notificações:** envio automático de e-mail (e, se possível, integração com WhatsApp) para lembretes de questionários
- **Backup e histórico:** nenhum dado de paciente deve ser excluído permanentemente sem confirmação; manter histórico de respostas

---

## 4. Possíveis Evoluções Futuras (fora do escopo inicial)

- Cadastro e envio de plano alimentar
- Agenda de consultas integrada
- Cobrança/pagamento online
- Integração com balanças/bioimpedância
- Geração automática de relatório de evolução em PDF
- Chat direto entre nutricionista e paciente

---

## 5. Resumo das Telas Principais

| Tela | Descrição |
|---|---|
| Login/Autenticação | Acesso exclusivo da nutricionista |
| Dashboard | Visão geral: pacientes ativos, questionários pendentes |
| Pacientes | Listagem, cadastro e edição de pacientes |
| Perfil do Paciente | Dados, histórico de evolução e questionários vinculados |
| Questionários | Criação, agendamento e acompanhamento de respostas |
| Formulário do Questionário (acesso via link) | Tela pública, sem login, onde o paciente responde ao questionário recebido |
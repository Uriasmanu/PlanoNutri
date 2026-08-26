# Documento de Requisitos — Plataforma para Nutricionista

## 1. Visão Geral

Sistema web voltado para nutricionistas autônomos ou pequenas clínicas, permitindo o gerenciamento de pacientes, criação e envio de planos alimentares, e acompanhamento periódico da evolução do paciente através de questionários com prazos personalizados.

**Objetivo principal:** centralizar o cadastro de pacientes, a prescrição de planos alimentares e o acompanhamento pós-consulta em um único sistema, reduzindo o uso de planilhas, PDFs avulsos e mensagens manuais via WhatsApp.

**Perfis de usuário:**
- **Nutricionista (admin):** cadastra pacientes, cria planos, envia questionários, acompanha respostas.
- **Paciente:** acessa seu plano alimentar e responde aos questionários enviados (via link ou área logada).

---

## 2. Funcionalidades

### 2.1 Cadastro de Paciente

**Descrição:** tela para o nutricionista cadastrar e gerenciar as informações dos pacientes.

**Campos sugeridos:**
- Dados pessoais: nome completo, data de nascimento, sexo, telefone, e-mail, CPF (opcional)
- Dados físicos iniciais: peso, altura, percentual de gordura (se disponível), circunferências (cintura, quadril, braço)
- Objetivo do paciente: emagrecimento, hipertrofia, reeducação alimentar, controle de doença (diabetes, hipertensão, etc.)
- Restrições e alergias alimentares
- Histórico clínico relevante (doenças pré-existentes, uso de medicamentos)
- Nível de atividade física
- Observações gerais (campo livre)
- Foto do paciente (opcional)

**Funcionalidades da tela:**
- Listagem de pacientes com busca e filtros (nome, status ativo/inativo, data da última consulta)
- Edição e exclusão (com confirmação) de cadastro
- Histórico de evolução física (peso e medidas ao longo do tempo, idealmente com gráfico)
- Status do paciente: ativo, inativo, em pausa

**Requisitos não funcionais:**
- Dados sensíveis de saúde devem seguir boas práticas de proteção de dados (LGPD), com controle de acesso restrito ao próprio nutricionista

---

### 2.2 Cadastro de Plano Alimentar

**Descrição:** tela para criação, edição e envio de planos alimentares vinculados a um paciente.

**Estrutura sugerida do plano:**
- Vínculo obrigatório com um paciente cadastrado
- Nome/identificação do plano (ex: "Plano de emagrecimento — Fase 1")
- Período de validade do plano (data início e fim)
- Divisão por refeições (café da manhã, lanche da manhã, almoço, lanche da tarde, jantar, ceia — customizável)
- Para cada refeição:
  - Lista de alimentos/itens
  - Quantidade e unidade de medida (g, ml, unidade, colher, xícara etc.)
  - Observações (ex: substituições permitidas, modo de preparo)
- Informações nutricionais totais do dia (calorias, macronutrientes) — calculado automaticamente ou inserido manualmente
- Restrições consideradas automaticamente com base nas alergias cadastradas do paciente (alerta caso um alimento conflite)
- Campo de observações gerais do plano (orientações de hidratação, suplementação, etc.)

**Funcionalidades da tela:**
- Biblioteca de alimentos reutilizável (banco de alimentos com informações nutricionais) para facilitar a montagem do plano
- Duplicar plano existente como base para um novo (útil para reaproveitar estrutura entre pacientes ou fases)
- Histórico de planos por paciente (versionamento — permite comparar planos anteriores)
- Exportação do plano em PDF para impressão ou envio
- Envio do plano diretamente ao paciente (e-mail, link de acesso ou notificação no sistema)

---

### 2.3 Questionário de Acompanhamento com Data Personalizada

**Descrição:** funcionalidade para o nutricionista criar e agendar o envio de questionários de acompanhamento, com prazo definido de forma flexível (ex: 1 semana, 2 meses, 15 dias) a partir da data de início do plano ou de uma data específica.

**Configuração do questionário:**
- Vínculo com um paciente (e opcionalmente com um plano alimentar específico)
- Título e descrição do questionário
- Banco de perguntas reutilizável, com tipos de resposta variados:
  - Texto livre
  - Múltipla escolha
  - Escala (ex: de 1 a 5 — nível de fome, satisfação, adesão ao plano)
  - Numérico (ex: peso atual)
  - Sim/Não
- Perguntas sugeridas padrão (customizáveis): adesão ao plano, dificuldades encontradas, sintomas, peso atual, nível de energia, qualidade do sono, evacuação, prática de atividade física

**Agendamento de envio:**
- Definição da data/prazo de envio de forma flexível:
  - Prazo relativo (ex: "7 dias após o início do plano", "2 meses após a última consulta")
  - Data fixa específica
  - Recorrência (ex: enviar a cada 15 dias enquanto o plano estiver ativo)
- Reenvio automático em caso de não resposta após X dias

**Canais de envio do questionário — opções, complexidade e custo:**

| Canal | Como funciona | Complexidade de implementação | Custo estimado |
|---|---|---|---|
| **E-mail** | Envio automático de link de acesso ao questionário via e-mail transacional | Baixa — serviços como SendGrid, Amazon SES, Resend ou Mailgun têm SDKs prontos e integração simples | Baixo — maioria dos provedores tem faixa gratuita (ex: até 3.000 envios/mês) e cobrança de poucos centavos por e-mail acima disso |
| **Notificação interna no sistema** | Paciente vê o questionário pendente ao logar na área do paciente (sem depender de canal externo) | Baixa — não depende de integração externa, apenas lógica própria do sistema | Nenhum custo adicional — já incluso no desenvolvimento da plataforma |
| **Notificação push (navegador ou app)** | Alerta push no navegador (Web Push) ou em app mobile, caso exista | Média — exige configuração de Service Worker, permissões do navegador e serviço de push (ex: Firebase Cloud Messaging); em app nativo exige integração com APNs/FCM | Baixo a médio — Firebase Cloud Messaging é gratuito; custo principal é o tempo de desenvolvimento |
| **Link direto via WhatsApp (manual)** | Sistema gera o link do questionário e o nutricionista o envia manualmente pelo próprio WhatsApp | Muito baixa — apenas geração de um link (`wa.me/...`) com o link do questionário | Nenhum custo — não usa API paga, mas depende de ação manual do nutricionista |
| **WhatsApp via API oficial (Business API)** | Envio automático do questionário direto no WhatsApp do paciente, via API oficial da Meta | Alta — exige aprovação de conta comercial Meta, aprovação de templates de mensagem, e geralmente um provedor intermediário (ex: Twilio, Z-API, 360dialog) | Médio a alto — custo por conversa iniciada (varia por país/categoria) + mensalidade do provedor intermediário; pode ficar entre R$ 0,05 e R$ 0,50 por conversa, mais taxa fixa mensal |
| **SMS** | Envio do link do questionário via mensagem de texto | Baixa a média — serviços como Twilio ou Zenvia têm integração simples via API | Médio — custo por SMS é mais alto que e-mail (em geral R$ 0,10 a R$ 0,30 por mensagem no Brasil) |
| **QR Code (impresso ou exibido no consultório)** | QR Code gerado apontando para o questionário, entregue no fim da consulta presencial | Muito baixa — apenas geração de QR Code a partir do link | Nenhum custo — geração de QR Code é gratuita (bibliotecas open source) |

**Recomendação de priorização:**
- **Fase inicial (MVP):** notificação interna no sistema + e-mail — cobrem a maior parte dos casos com baixo custo e baixa complexidade
- **Fase intermediária:** link direto via WhatsApp manual (zero custo, alta adesão no Brasil) e QR Code para consultas presenciais
- **Fase avançada (opcional):** WhatsApp via API oficial — só se justifica com volume alto de pacientes, pois envolve custo recorrente e maior complexidade de homologação; SMS costuma ser dispensável no Brasil dado o uso massivo do WhatsApp

**Acompanhamento das respostas:**
- Painel com status de cada questionário: pendente, respondido, atrasado
- Visualização das respostas do paciente, com histórico comparativo entre envios
- Alertas para o nutricionista quando houver respostas que indiquem atenção (ex: sintomas relatados, baixa adesão)

---

## 3. Requisitos Não Funcionais

- **Segurança e privacidade:** dados de saúde são sensíveis (LGPD); autenticação obrigatória, controle de acesso por perfil, criptografia de dados sensíveis
- **Responsividade:** acesso via desktop (nutricionista) e mobile (paciente, principalmente para responder questionários e visualizar o plano)
- **Notificações:** envio de e-mail (e, se possível, integração com WhatsApp) para lembretes de questionários e planos
- **Backup e histórico:** nenhum dado de paciente deve ser excluído permanentemente sem confirmação; manter histórico de planos e respostas

---

## 4. Possíveis Evoluções Futuras (fora do escopo inicial)

- Agenda de consultas integrada
- Cobrança/pagamento online
- App mobile dedicado para o paciente
- Integração com balanças/bioimpedância
- Geração automática de relatório de evolução em PDF
- Chat direto entre nutricionista e paciente

---

## 5. Resumo das Telas Principais

| Tela | Descrição |
|---|---|
| Login/Autenticação | Acesso do nutricionista e do paciente |
| Dashboard | Visão geral: pacientes ativos, questionários pendentes, planos a vencer |
| Pacientes | Listagem, cadastro e edição de pacientes |
| Perfil do Paciente | Dados, histórico de evolução, planos e questionários vinculados |
| Planos Alimentares | Criação, edição e histórico de planos |
| Questionários | Criação, agendamento e acompanhamento de respostas |
| Área do Paciente | Visualização do plano atual e resposta aos questionários |
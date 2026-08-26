# Design System Specification — PlanoNutri

**Projeto:** Plataforma para Nutricionista
**Data:** Agosto/2026
**Status:** Em definição (pré-MVP)
**Bibliotecas base:** shadcn/ui + Tailwind CSS + Radix UI + Lucide Icons

---

## 1. Paleta de Cores

Cores baseadas no tema padrão do shadcn/ui (CSS variables), com personalização para o contexto de saúde/nutrição.

### Light Mode

| Token | Valor | Uso |
|---|---|---|
| `--background` | `0 0% 100%` (#ffffff) | Fundo geral da aplicação |
| `--foreground` | `222.2 84% 4.9%` | Texto principal |
| `--card` | `0 0% 100%` | Fundo de cards e superfícies elevadas |
| `--card-foreground` | `222.2 84% 4.9%` | Texto em cards |
| `--primary` | `142 76% 36%` (#16a34a) | Ações principais, links, destaque — verde (saúde/nutrição) |
| `--primary-foreground` | `0 0% 98%` | Texto sobre primary |
| `--secondary` | `210 40% 96%` | Fundo secundário, badges, chips |
| `--secondary-foreground` | `222.2 47.4% 11.2%` | Texto sobre secondary |
| `--muted` | `210 40% 96%` | Fundo de elementos mutados/desabilitados |
| `--muted-foreground` | `215.4 16.3% 46.9%` | Texto secundário, placeholders |
| `--accent` | `210 40% 96%` | Fundo de hover/active em itens |
| `--accent-foreground` | `222.2 47.4% 11.2%` | Texto sobre accent |
| `--destructive` | `0 84.2% 60.2%` | Erros, exclusões, ações destrutivas |
| `--destructive-foreground` | `0 0% 98%` | Texto sobre destructive |
| `--border` | `214.3 31.8% 91.4%` | Bordas de componentes |
| `--input` | `214.3 31.8% 91.4%` | Bordas de inputs |
| `--ring` | `142 76% 36%` | Anel de foco (accessibility) |
| `--success` | `142 76% 36%` | Confirmações, status positivo |
| `--warning` | `38 92% 50%` | Alertas, atenção |
| `--info` | `217 91% 60%` | Informações neutras |

### Dark Mode

| Token | Valor | Uso |
|---|---|---|
| `--background` | `222.2 84% 4.9%` | Fundo geral |
| `--foreground` | `210 40% 98%` | Texto principal |
| `--card` | `222.2 84% 4.9%` | Fundo de cards |
| `--card-foreground` | `210 40% 98%` | Texto em cards |
| `--primary` | `142 76% 36%` | Mantido — verde (saúde) |
| `--primary-foreground` | `0 0% 98%` | Texto sobre primary |
| `--secondary` | `217.2 32.6% 17.5%` | Fundo secundário |
| `--secondary-foreground` | `210 40% 98%` | Texto sobre secondary |
| `--muted` | `217.2 32.6% 17.5%` | Fundo mutado |
| `--muted-foreground` | `215 20.2% 65.1%` | Texto secundário |
| `--accent` | `217.2 32.6% 17.5%` | Hover/active |
| `--accent-foreground` | `210 40% 98%` | Texto sobre accent |
| `--destructive` | `0 62.8% 30.6%` | Erros |
| `--destructive-foreground` | `210 40% 98%` | Texto sobre destructive |
| `--border` | `217.2 32.6% 17.5%` | Bordas |
| `--input` | `217.2 32.6% 17.5%` | Bordas de inputs |
| `--ring` | `142 76% 36%` | Anel de foco |
| `--success` | `142 76% 36%` | Status positivo |
| `--warning` | `38 92% 50%` | Alertas |
| `--info` | `217 91% 60%` | Informações |

---

## 2. Tipografia

### Font Family

| Contexto | Fonte | Fallback |
|---|---|---|
| Corpo (geral) | `Inter` | `system-ui, sans-serif` |
| Monocromático / código | `JetBrains Mono` | `monospace` |

### Font Sizes (Tailwind defaults)

| Token | Tamanho | Uso |
|---|---|---|
| `text-xs` | `0.75rem` (12px) | Labels secundários, badges, timestamps |
| `text-sm` | `0.875rem` (14px) | Texto secundário, descrições auxiliares |
| `text-base` | `1rem` (16px) | Corpo de texto, formulários |
| `text-lg` | `1.125rem` (18px) | Subtítulos, cards de paciente |
| `text-xl` | `1.25rem` (20px) | Títulos de seção |
| `text-2xl` | `1.5rem` (24px) | Títulos de página |
| `text-3xl` | `1.875rem` (30px) | Dashboard / títulos de destaque |

### Font Weights

| Token | Peso | Uso |
|---|---|---|
| `font-normal` | 400 | Texto corrido |
| `font-medium` | 500 | Labels, navegação |
| `font-semibold` | 600 | Títulos, botões |
| `font-bold` | 700 | Títulos de destaque (uso moderado) |

### Line Heights

| Token | Valor | Uso |
|---|---|---|
| `leading-none` | 1 | Títulos grandes |
| `leading-tight` | 1.25 | Títulos |
| `leading-normal` | 1.5 | Corpo de texto, formulários |
| `leading-relaxed` | 1.625 | Textos longos (observações, histórico) |

---

## 3. Espaçamentos

Utilizar a escala padrão do Tailwind CSS para manter consistência:

| Token | Valor | Uso típico |
|---|---|---|
| `p-1` / `m-1` | `0.25rem` (4px) | Espaçamento interno mínimo |
| `p-2` / `m-2` | `0.5rem` (8px) | Padding interno de inputs, gaps pequenos |
| `p-3` / `m-3` | `0.75rem` (12px) | Cards compactos, listas |
| `p-4` / `m-4` | `1rem` (16px) | Padding padrão de cards e seções |
| `p-5` / `m-5` | `1.25rem` (20px) | Seções com mais respiro |
| `p-6` / `m-6` | `1.5rem` (24px) | Padding de página, modais |
| `p-8` / `m-8` | `2rem` (32px) | Espaçamento entre seções grandes |

**Regras:**
- Gap entre itens de lista: `gap-3` (12px) ou `gap-4` (16px)
- Gap entre seções: `gap-6` (24px) ou `gap-8` (32px)
- Padding de cards: `p-4` (16px) mínimo
- Padding de página em desktop: `p-6` ou `p-8`
- Padding de página em mobile: `p-4`

---

## 4. Border Radius

| Token | Valor | Uso |
|---|---|---|
| `rounded-none` | `0` | Sem arredondamento |
| `rounded-sm` | `0.125rem` (2px) | Bordas sutis |
| `rounded` | `0.25rem` (4px) | Padrão — inputs, botões, cards |
| `rounded-md` | `0.375rem` (6px) | Cards, modais |
| `rounded-lg` | `0.5rem` (8px) | Cards destacados, containers |
| `rounded-xl` | `0.75rem` (12px) | Modais, painéis |
| `rounded-full` | `9999px` | Avatares, badges, botões circulares |

**Regras:**
- Inputs e botões: `rounded-md` (6px)
- Cards: `rounded-lg` (8px)
- Modais: `rounded-xl` (12px)
- Avatares do paciente: `rounded-full`

---

## 5. Sombras

| Token | Tailwind | Uso |
|---|---|---|
| Sombra sutil | `shadow-sm` | Cards em repouso, badges |
| Sombra padrão | `shadow` | Cards com elevação, dropdowns |
| Sombra média | `shadow-md` | Modais, popovers |
| Sombra forte | `shadow-lg` | Tooltips, menus flutuantes |
| Sombra de foco | `ring-2 ring-primary/50` | Anel de acessibilidade em inputs/botões |

**Regras:**
- Evitar sombras excessivas — manter visual limpo e profissional
- Sombras devem ter contraste suficiente em light e dark mode
- Usar `ring` ao invés de `shadow` para estados de foco (acessibilidade)

---

## 6. Breakpoints

| Nome | Largura | Tailwind | Dispositivos |
|---|---|---|---|
| Mobile pequeno | até 375px | `sm` (640px) | iPhone SE, Android compacto |
| Mobile padrão | 376px – 430px | — | iPhone 14/15, Pixel |
| Tablet | 431px – 768px | `md` (768px) | iPad mini, tablets |
| Notebook | 769px – 1280px | `lg` (1024px), `xl` (1280px) | Laptops 13"–15" |
| Desktop | acima de 1280px | `2xl` (1536px) | Monitores externos |

**Estratégia:** Mobile-first — estilizar para telas pequenas e sobrescrever com `min-width` para maiores.

**Regras obrigatórias:**
- Área mínima de toque: 44x44px em mobile
- Texto mínimo: 16px corpo, 14px secundário
- Nenhum conteúdo principal com scroll horizontal
- Menu hamburguer em mobile, sidebar em desktop
- Testar em: 375px, 768px, 1024px, 1440px

---

## 7. Componentes

Componentes baseados no **shadcn/ui** (built on Radix UI), com personalização conforme o Design System.

### 7.1 Button

| Variant | Uso | Exemplo |
|---|---|---|
| `default` | Ação principal (salvar, enviar questionário) | Verde (primary) |
| `secondary` | Ação alternativa (cancelar, voltar) | Cinza (secondary) |
| `destructive` | Exclusão, ação irreversível | Vermelho (destructive) |
| `outline` | Ação terciária, navegação | Borda, fundo transparente |
| `ghost` | Ações inline, hover de listas | Sem borda/fundo |
| `link` | Links navegáveis | Sublinhado |

| Tamanho | Uso |
|---|---|
| `sm` | Botões em tabelas, ações compactas |
| `default` | Padrão — formulários, ações gerais |
| `lg` | CTAs de página, formulários de questionário do paciente |
| `icon` | Botões de ícone (ex: deletar, editar) |

**Regras:**
- Mínimo 44x44px de área de toque em mobile
- Label claro e descritivo (evitar apenas ícone sem tooltip)
- States: default, hover, active, disabled, loading

### 7.2 Input / Formulários

| Componente | Uso |
|---|---|
| `Input` | Campos de texto curto (nome, telefone, e-mail) |
| `Textarea` | Texto livre (observações, histórico clínico) |
| `Select` | Seleção única (status, objetivo do paciente) |
| `Checkbox` | Seleção múltipla (restrições alimentares) |
| `RadioGroup` | Seleção exclusiva (sexo, nível de atividade) |
| `DatePicker` | Datas (data de nascimento, agendamento) |
| `Slider` | Escala numérica (1-5 nível de fome, satisfação) |

**Regras:**
- Labels sempre visíveis (acima do campo ou como placeholder + label flutuante)
- Mensagens de erro abaixo do campo, com ícone
- States: default, focus, error, disabled
- Anel de foco acessível com `ring-primary/50`
- Validação inline (não apenas no submit)

### 7.3 Card

| Tipo | Uso |
|---|---|
| `Card` genérico | Containers de informação (perfil do paciente, questionário) |
| `CardHeader` | Título + descrição do card |
| `CardContent` | Corpo do card |
| `CardFooter` | Ações do card (botões) |

**Regras:**
- Padding: `p-4` mínimo
- Sombra: `shadow-sm` em repouso, `shadow-md` em hover (se interativo)
- Bordas: `border border-border`
- Paciente card: avatar + nome + status + última consulta

### 7.4 Modal / Dialog

| Propriedade | Valor |
|---|---|
| Largura máxima | `max-w-lg` (512px) padrão, `max-w-xl` para formulários longos |
| Padding | `p-6` |
| Border radius | `rounded-xl` |
| Overlay | `bg-black/50` com backdrop blur |
| Animação | Fade in + scale (padrão Radix UI) |

**Uso:** Confirmação de exclusão, criação/edição de paciente, criação de questionário.

### 7.5 Table

| Propriedade | Valor |
|---|---|
| Header | `font-semibold`, `bg-muted` |
| Rows | `hover:bg-muted/50` |
| Padding células | `p-3` |
| Border | `border-b border-border` |

**Uso:** Listagem de pacientes, histórico de questionários, respostas.

### 7.6 Badge / Chip

| Variant | Uso |
|---|---|
| `default` | Informação neutra |
| `secondary` | Status secundário |
| `destructive` | Status de erro/atenção |
| `outline` | Tags genéricas |

**Status de paciente:** `ativo` (success/green), `inativo` (muted/gray), `em pausa` (warning/yellow).
**Status de questionário:** `pendente` (info/blue), `respondido` (success/green), `atrasado` (destructive/red).

### 7.7 Tabs

**Uso:** Navegação entre seções do perfil do paciente (dados, histórico, questionários).

### 7.8 DropdownMenu

**Uso:** Ações em listas (editar, excluir, enviar questionário).

### 7.9 Toast / Sonner

**Uso:** Feedback de ações (paciente salvo, questionário enviado, erro de conexão).

### 7.10 Skeleton

**Uso:** Loading states enquanto dados são carregados.

### 7.11 Avatar

**Uso:** Iniciais do paciente quando não há foto (padrão shadcn/ui).

### 7.12 Separator

**Uso:** Divisão visual entre seções (`<Separator />` com `my-4`).

### 7.13 ScrollArea

**Uso:** Listas longas (histórico de evolução, banco de perguntas) com scroll customizado.

---

## 8. Bibliotecas Utilizadas

| Biblioteca | Versão (recomendada) | Finalidade |
|---|---|---|
| **shadcn/ui** | Latest | Componentes de UI prontos e customizáveis |
| **Tailwind CSS** | 3.x+ | Utility-first CSS framework |
| **Radix UI** | Latest (via shadcn) | Primitivas acessíveis (dialog, dropdown, tabs) |
| **Lucide Icons** | Latest | Ícones consistentes e leves |
| **class-variance-authority (cva)** | Latest | Variantes de componentes (via shadcn) |
| **clsx + tailwind-merge** | Latest | Concatenação condicional de classes |
| **React Hook Form** | Latest | Formulários controlados com validação |
| **Zod** | Latest | Schema validation (tipado com React Hook Form) |
| **date-fns** | Latest | Manipulação e formatação de datas |
| **Recharts** | Latest | Gráficos de evolução (peso, medidas) |

---

## 9. Tokens de Design

Os tokens são definidos como CSS variables no `globals.css` e consumidos via Tailwind config.

### Estrutura de Tokens

```
:root {
  /* Cores */
  --color-primary: hsl(142, 76%, 36%);
  --color-primary-foreground: hsl(0, 0%, 98%);
  --color-secondary: hsl(210, 40%, 96%);
  --color-background: hsl(0, 0%, 100%);
  --color-foreground: hsl(222.2, 84%, 4.9%);
  --color-destructive: hsl(0, 84.2%, 60.2%);
  --color-success: hsl(142, 76%, 36%);
  --color-warning: hsl(38, 92%, 50%);
  --color-info: hsl(217, 91%, 60%);

  /* Tipografia */
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;

  /* Espaçamentos (se necessário customizar) */
  --spacing-page: 1.5rem;

  /* Border radius */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;
  --radius-lg: 0.5rem;
  --radius-xl: 0.75rem;
}
```

### Conversão para Tailwind

No `tailwind.config.ts`, mapear tokens para extensões:

```ts
theme: {
  extend: {
    colors: {
      primary: 'hsl(var(--color-primary) / <alpha-value>)',
      // ...
    },
    fontFamily: {
      sans: ['var(--font-sans)'],
      mono: ['var(--font-mono)'],
    },
    borderRadius: {
      xl: 'var(--radius-xl)',
    },
  },
}
```

---

## 10. Padrões de Implementação

### Estrutura de Pastas (Frontend)

```
src/
├── app/                    # Next.js App Router (se aplicável)
├── components/
│   ├── ui/                 # Componentes base do shadcn/ui
│   ├── forms/              # Componentes de formulário específicos
│   ├── patients/           # Componentes do módulo de pacientes
│   ├── questionnaires/     # Componentes do módulo de questionários
│   └── layout/             # Header, Sidebar, Footer
├── lib/
│   ├── utils.ts            # cn(), formatadores, helpers
│   └── validations.ts      # Schemas Zod
├── hooks/                  # Custom hooks
├── services/               # Chamadas à API
└── types/                  # Tipagens TypeScript
```

### Convenções de Nomenclatura

| Elemento | Padrão | Exemplo |
|---|---|---|
| Componentes | `PascalCase` | `PatientCard.tsx`, `QuestionnaireForm.tsx` |
| Funções/hooks | `camelCase` | `usePatientData()`, `formatDate()` |
| Arquivos de componentes | `PascalCase.tsx` | `PatientCard.tsx` |
| Arquivos de util | `camelCase.ts` | `formatDate.ts` |
| CSS classes | Tailwind utilities | `className="flex items-center gap-4"` |
| Variáveis de estado | `camelCase` | `isSubmitting`, `patientData` |
| Constantes | `UPPER_SNAKE_CASE` | `MAXPATIENTS`, `API_BASE_URL` |

### Regras de Componentização

1. **Um componente por arquivo** — nome do arquivo = nome do componente
2. **Props explícitas** — definir interface de props para todo componente
3. **Componentes presentacionais vs. container** — separar lógica de apresentação
4. **Reuso antes de duplicação** — verificar componentes existentes antes de criar novo
5. **Nunca hardcode** — textos, cores, valores fixos devem ser props ou constantes

---

## 11. Regras de Acessibilidade (a11y)

Baseadas nos padrões do Radix UI e WCAG 2.1 AA.

### Requisitos Obligatórios

- [ ] **Contraste mínimo:** 4.5:1 para texto normal, 3:1 para texto grande (WCAG AA)
- [ ] **Foco visível:** todo elemento interativo deve ter anel de foco visível (`ring-primary/50`)
- [ ] **Área de toque:** mínimo 44x44px em mobile para botões e links
- [ ] **Labels:** todo input deve ter um `<Label>` associado (via `htmlFor` ou wrapper)
- [ ] **Mensagens de erro:** associadas ao campo via `aria-describedby`
- [ ] **Navegação por teclado:** todos os elementos interativos acessíveis via Tab
- [ ] **Roles semânticos:** usar `<nav>`, `<main>`, `<header>`, `<aside>` corretamente
- [ ] **Alt text:** toda imagem informativa deve ter `alt` descritivo
- [ ] **Live regions:** notificações dinâmicas via `aria-live="polite"` (toasts)
- [ ] **Skip links:** link "Pular para conteúdo principal" no topo da página

### Acessibilidade em Formulários

- Labels associados a todos os campos
- Erros anunciados via `aria-live` ou `role="alert"`
- Campos obrigatórios indicados via `aria-required="true"` e visualmente (`*`)
- Agrupamento de campos relacionados via `<fieldset>` e `<legend>`

### Acessibilidade em Modais

- Foco trappeado dentro do modal (Radix UI cuida disso)
- Fechamento via `Escape`
- Fechamento clicando no overlay
- Retorno de foco ao elemento que abriu o modal ao fechar

---

## 12. Convenções de Nomenclatura CSS

### Utility Classes (Tailwind)

- **Ordenar classes** na seguinte ordem: layout → box model → tipografia → visual → interativo
- **Exemplo:** `className="flex items-center gap-4 p-4 text-sm font-medium text-foreground hover:bg-muted rounded-md"`

### Customização

- Evitar `@apply` — preferir classes utilitárias diretamente no JSX
- Estilos customizados apenas quando Tailwind não oferece solução (anim complexas)
- CSS modules ou styled-components NÃO utilizar —manter Tailwind como única abordagem

### Responsividade

- Mobile-first: classes sem prefixo = mobile, `md:` = tablet, `lg:` = desktop
- Exemplo: `className="flex flex-col gap-4 md:flex-row md:gap-6"`

---

## 13. Gráficos e Visualização de Dados

Para gráficos de evolução (peso, medidas, IMC), utilizar **Recharts** com tema customizado:

| Propriedade | Valor |
|---|---|
| Cor da linha | `var(--color-primary)` (verde) |
| Cor de fundo do gráfico | Transparente |
| Grid | `stroke-border` (sutil) |
| Tooltip | Componente customizado com fundo `card` |
| Responsivo | `ResponsiveContainer` do Recharts (100% largura) |

**Dados exibidos:** peso ao longo do tempo, IMC, circunferências, percentual de gordura (quando disponível).

---

> **Nota:** Este documento deve ser revisado e atualizado conforme decisões de design são tomadas durante o desenvolvimento. Decisões significativas devem ser registradas no DDR (`DDR — Design Decision Record.md`).

É o documento que centraliza as regras e decisões visuais e técnicas da interface, como:

- **Paleta de cores**
  - Primary
  - Secondary
  - Background
  - Surface
  - Error/Success/Warning

- **Tipografia**
  - Font family
  - Font sizes
  - Font weights
  - Line heights

- **Espaçamentos**
- **Border radius**
- **Sombras**
- **Breakpoints**

- **Componentes**
  - Button
  - Input
  - Modal
  - Card
  - etc.

- **Bibliotecas utilizadas**
  - shadcn/ui
  - Tailwind CSS
  - Radix UI
  - Lucide Icons

- **Padrões de implementação**
- **Tokens de design**
- Regras de acessibilidade
- Convenções de nomenclatura

---

### Mas existe uma distinção importante

Se o documento for **mais técnico**, contendo dependências e decisões de arquitetura, eu chamaria de:

**`Technical Design Specification` (TDS)**

ou

**`Frontend Architecture / Frontend Guidelines`**

Por exemplo:

```text
docs/
├── architecture.md
├── design-system.md
├── frontend-guidelines.md
└── dependencies.md
```

Já se você quer **um único documento que funcione como a "fonte da verdade" do projeto**, reunindo **shadcn + cores + fontes + componentes + padrões visuais**, eu recomendaria:

> **Design System Specification**

Esse nome deixa bem claro que não é apenas uma documentação visual: é a **especificação do sistema de design** que deve ser seguida durante o desenvolvimento.

Se estiver fazendo isso para um projeto profissional, eu também usaria o conceito de **Design Tokens**, porque aí cores, fontes, espaçamentos, radius etc. deixam de ser apenas uma lista de valores e passam a ser definições reutilizáveis pelo código.

# Especificação — 3D Store

Documento de ideia, requisitos e comportamento do site. Complementa o [README](../README.md).

---

## 1. Ideia

A **3D Store** é uma vitrine de ateliê de impressão 3D: peças úteis e decorativas, feitas sob demanda, vendidas como produto físico (não arquivo STL).

O público-alvo é quem quer um objeto pronto — suporte de fone, vaso, gancho, luminária — sem operar impressora. A marca se posiciona como loja, não como repositório de modelos.

Premissas:

- Catálogo pequeno e curado, não marketplace de mil SKUs
- Cada item tem foto real, material, cores e preço em reais
- A jornada é a de e-commerce clássico: descobrir → detalhe → carrinho → conta
- Nesta versão acadêmica não há pagamento nem estoque: o checkout é só o resumo do pedido

Referência visual: arquivo Figma Make [Follow PDF Instructions](https://www.figma.com/make/WpmFIt8Wv5dAm0xmMoxbAh/Follow-PDF-Instructions) (`WpmFIt8Wv5dAm0xmMoxbAh`), criado em agosto de 2026.

---

## 2. Objetivos

| Objetivo | Como aparece no site |
| --- | --- |
| Transmitir identidade de loja 3D | Hero “Produtos únicos criados em 3D”, stats 500+ / 4.9 / 3D, foto de impressora |
| Facilitar descoberta | Categorias na home, busca no header, filtros no catálogo |
| Converter | CTA “Ir às compras”, card de produto, adicionar ao carrinho |
| Gerar confiança | Página Sobre nós, avaliações, material e cores no detalhe |
| Permitir conta | Cadastro / login persistidos no navegador |

Fora de escopo nesta entrega: pagamento real, frete calculado, painel admin, backend, e-mail, estoque.

---

## 3. Identidade visual (Figma)

### 3.1 Paleta

| Token | Hex / valor | Uso |
| --- | --- | --- |
| Fundo | `#07070f` | Página |
| Card | `#12121c` | Superfícies elevadas |
| Linha | `rgba(255,255,255,0.08)` | Bordas |
| Texto | `#ffffff` | Títulos |
| Muted | `#9ca3af` | Corpo, placeholders |
| Roxo | `#8b5cf6` / `#7c3aed` | Botão primário, badges, carrinho |
| Ciano | `#22d3ee` / `#67e8f9` | Destaque “criados em 3D”, links, “Novo” |

Botão primário: gradiente `135deg` de `#7c3aed` → `#8b5cf6` → `#a78bfa`, sombra roxa.

Headline do hero: “Produtos únicos” em branco; “criados em 3D” em gradiente ciano.

### 3.2 Tipografia e forma

- Fonte: **Inter** (400–800), Google Fonts
- Cantos: `rounded-xl` / `rounded-2xl` / `rounded-3xl` (≈ 12–24 px)
- Header fixo (~72 px), blur no fundo
- Cards com borda sutil e hover com elevação + borda roxa

### 3.3 Header (especificação Figma)

Da esquerda para a direita:

1. Logo (cubo/losango em gradiente ciano–roxo) + texto **3D Store**
2. Navegação: **Início**, **Catálogo**, **Lançamentos**, **Sobre nós**
3. Busca com placeholder **O que você procura?**
4. Ícone de idioma (globo)
5. **Entrar**
6. Botão **Cadastre-se** (roxo)

Em telas estreitas a navegação e a busca vão para um menu hamburger.

### 3.4 Home (acima da dobra)

- Badge: **Transforme suas ideias**
- Título e parágrafo de apoio
- CTAs: **Ir às compras** (primário) e **Saiba mais** (contorno)
- Métricas: **500+ Itens**, **4.9 Avaliações**, **3D Impressão**
- Fundo à direita: impressora 3D com fade
- Faixa **Categorias**: sete cards com ícone colorido e rótulo

Categorias do Figma:

| ID | Rótulo |
| --- | --- |
| `vasos` | Vasos |
| `action-figures` | Action Figures |
| `decoracao` | Decoração |
| `utilitarios` | Utilitários |
| `games` | Games |
| `cutelaria` | Cutelaria |
| `acessorios` | Acessórios |

Abaixo da dobra (extensão coerente com o tema, não visível na miniatura do Make): **Destaques** (produtos `featured`) e bloco “Do arquivo à sua mesa”.

---

## 4. Arquitetura

SPA (Single Page Application). O Vite entrega HTML + JS; o React Router troca as telas sem recarregar.

```
Browser
  └── App
        ├── AuthProvider     localStorage: 3dstore-user, 3dstore-accounts
        ├── CartProvider     localStorage: 3dstore-cart
        └── Layout
              ├── Header
              ├── <página>
              └── Footer
```

Catálogo: módulo estático `src/data/products.ts` (sem fetch).

Imagens: arquivos em `public/products/`, servidos em `/products/<arquivo>.jpg`.

---

## 5. Rotas

| Caminho | Página | Comportamento |
| --- | --- | --- |
| `/` | Home | Hero, categorias, destaques |
| `/catalogo` | Catálogo | Query `?categoria=`, `?q=`, `?ordem=` |
| `/lancamentos` | Lançamentos | Produtos com `isNew` |
| `/sobre` | Sobre nós | Texto institucional + três valores |
| `/produto/:id` | Detalhe | 404 amigável se o id não existir |
| `/carrinho` | Carrinho | Vazio → CTA para o catálogo |
| `/entrar` | Login | Redireciona para `/` em sucesso |
| `/cadastro` | Cadastro | Cria conta e entra |
| `*` | — | Redireciona para `/` |

### Query do catálogo

- `categoria`: um dos IDs da tabela da seção 3.4
- `q`: texto da busca (também usado pelo formulário do header)
- `ordem`: `destaque` (padrão), `menor`, `maior`, `avaliacao`

---

## 6. Modelo de dados

### 6.1 Produto

```ts
type Product = {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;   // se existir, mostra “Oferta”
  category: CategoryId;
  rating: number;
  reviews: number;
  image: string;            // URL pública, ex. /products/filtro-dino.jpg
  description: string;
  material: string;
  colors: string[];         // primeira cor é o padrão no detalhe
  isNew?: boolean;
  featured?: boolean;
  imageFit?: "cover" | "contain";
  imagePosition?: "center" | "top";
};
```

Preços em `number` (BRL). Exibição: `toLocaleString("pt-BR", { style: "currency", currency: "BRL" })`.

### 6.2 Item de carrinho

Chave composta `productId + color` (a mesma peça em cores diferentes são linhas distintas).

```ts
type CartItem = { productId: string; quantity: number; color: string };
```

### 6.3 Conta

```ts
type User = { name: string; email: string };
type Account = User & { password: string };
```

Validação no cadastro: nome ≥ 2 caracteres, e-mail com `@`, senha ≥ 6 caracteres, e-mail único (case-insensitive). Login compara e-mail + senha. Senhas ficam em texto no `localStorage` — aceitável só como protótipo.

---

## 7. Regras de interface

### 7.1 Busca

Com 2+ caracteres, o header abre um dropdown com até 6 resultados. Submit navega para `/catalogo?q=...`. A busca considera nome, descrição e rótulo da categoria.

### 7.2 Cards

- Área da foto **sempre quadrada** (`aspect-square`), para o grid não quebrar com fotos de proporções diferentes
- Colagens verticais usam `object-cover` + `object-top` (mostra o painel principal)
- Na página de detalhe, as mesmas colagens usam `object-contain` para ver o conjunto inteiro
- Badge **Novo** (`isNew`) e **Oferta** (`originalPrice`)

### 7.3 Detalhe do produto

- Breadcrumb Catálogo / categoria / nome
- Seletor de cor e quantidade (≥ 1)
- Adicionar ao carrinho; confirmação com atalho para `/carrinho`
- Até 3 relacionados da mesma categoria

### 7.4 Carrinho

- Alterar quantidade, remover linha, limpar tudo
- Subtotal = soma de `preço × quantidade`
- Frete: texto “Calculado no checkout” (não implementado)
- **Finalizar compra** não processa pagamento

### 7.5 Sessão

Com usuário logado, o header troca Entrar/Cadastre-se por nome + **Sair**. Logout só remove a sessão (`3dstore-user`); as contas continuam em `3dstore-accounts`.

---

## 8. Catálogo atual

| ID | Nome | Categoria | Preço (R$) | Foto |
| --- | --- | --- | --- | --- |
| `filtro-dino` | Filtro de linha dinossauro | Utilitários | 89,90 (de 109,90) | `filtro-dino.jpg` |
| `aquario-r2d2` | Aquário de mesa R2-D2 | Decoração | 249,90 | `aquario-r2d2.jpg` |
| `luminaria-estrela` | Luminária Estrela da Morte | Decoração | 159,90 | `luminaria-estrela.jpg` |
| `porta-alho` | Porta-alho Bulbasaur | Cutelaria | 42,90 | `porta-alho.jpg` |
| `suporte-headset` | Suporte de headset polvo | Games | 64,90 | `suporte-headset.jpg` |
| `gancho-trex` | Gancho de parede T-Rex | Acessórios | 34,90 | `gancho-trex.jpg` |
| `vaso-zen` | Vaso humanóide zen | Vasos | 69,90 | `vaso-zen.jpg` |
| `amplificador-celular` | Amplificador acústico de celular | Utilitários | 54,90 | `amplificador-celular.jpg` |
| `porta-chaves` | Porta-chaves estilo bloco | Acessórios | 39,90 | `porta-chaves.jpg` |
| `escorredor-elefante` | Escorredor elefante | Cutelaria | 47,90 | `escorredor-elefante.jpg` |
| `suporte-tacas` | Suporte de taças sob prateleira | Utilitários | 44,90 | `suporte-tacas.jpg` |
| `vasos-dino` | Vasos dinossauro (kit) | Vasos | 79,90 | `vasos-dino.jpg` |
| `luminaria-cao` | Luminária cachorro articulada | Decoração | 119,90 | `luminaria-cao.jpg` |

A categoria **Action Figures** existe na navegação (Figma) mas não tem SKU neste conjunto de fotos.

Itens `featured` na home: filtro dino, aquário, luminária estrela, porta-alho, headset, vaso zen, vasos dino.

Itens `isNew` em Lançamentos: filtro dino, porta-alho, porta-chaves, vasos dino, luminária cão.

---

## 9. Mapa de arquivos

```
3Dproducts/
├── README.md
├── docs/especificacao.md      ← este arquivo
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── public/
│   ├── favicon.svg
│   └── products/              fotos do catálogo
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css              tokens Tailwind
    ├── vite-env.d.ts
    ├── data/products.ts
    ├── context/
    │   ├── AuthContext.tsx
    │   └── CartContext.tsx
    ├── components/
    │   ├── Layout.tsx
    │   ├── Header.tsx
    │   ├── Footer.tsx
    │   ├── Logo.tsx
    │   ├── ProductCard.tsx
    │   └── CategoryGlyph.tsx
    └── pages/
        ├── HomePage.tsx
        ├── CatalogPage.tsx
        ├── ReleasesPage.tsx
        ├── AboutPage.tsx
        ├── ProductPage.tsx
        ├── CartPage.tsx
        └── AuthPages.tsx
```

---

## 10. Requisitos não funcionais

- **Idioma:** interface em pt-BR
- **Responsivo:** header e grids (2 / 4 / 7 colunas nas categorias; 1 / 2 / 3 nos produtos)
- **Persistência:** sobrevive a F5 no mesmo navegador; não sincroniza entre dispositivos
- **Acessibilidade básica:** `aria-label` em carrinho, menu e quantidade; imagens de produto com `alt` igual ao nome
- **Performance:** bundle estático; imagens JPEG locais (sem CDN)

---

## 11. Limitações conhecidas

- Sem servidor: qualquer pessoa no DevTools lê contas e senhas do `localStorage`
- “Finalizar compra” não cobra nem gera pedido
- Ícone de idioma no header não traduz a UI (só alterna o atributo visual PT/EN)
- Fotos de produto são material de referência; não há garantia de licença comercial
- Categoria Action Figures vazia no catálogo atual

---

## 12. Evolução sugerida

1. Backend (REST ou BaaS) para catálogo, usuários e pedidos
2. Hash de senha e sessão com cookie/JWT
3. Checkout (Pix / cartão) e cálculo de frete
4. Painel para incluir SKU e foto
5. Internacionalização de verdade no globo do header
6. Preencher Action Figures ou ocultar categoria vazia

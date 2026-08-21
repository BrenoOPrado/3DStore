# 3D Store

Loja virtual de peças impressas em 3D. O visitante navega por categorias, vê detalhes do produto, escolhe cor e quantidade, monta um carrinho e cria uma conta — tudo no navegador, sem backend.

O visual segue o protótipo **3D Store** gerado no [Figma Make](https://www.figma.com/make/WpmFIt8Wv5dAm0xmMoxbAh/Follow-PDF-Instructions): tema escuro, acentos em roxo e ciano, tipografia Inter e interface em português.

Documentação completa da ideia, telas, dados e regras: [`docs/especificacao.md`](docs/especificacao.md).

## O que o site faz

- Home com hero, categorias, destaques e chamada para o ateliê
- Catálogo com filtro por categoria, busca e ordenação
- Página de produto (cor, quantidade, itens relacionados)
- Carrinho persistido no `localStorage`
- Cadastro e login locais (sem servidor)
- Lançamentos (itens marcados como novos) e página Sobre nós

## Stack

| Camada | Tecnologia |
| --- | --- |
| UI | React 19 + TypeScript |
| Rotas | React Router 7 |
| Estilo | Tailwind CSS 4 (tema em `src/index.css`) |
| Ícones | lucide-react |
| Build | Vite 7 |

Não há API, banco nem gateway de pagamento. Catálogo, contas e carrinho vivem no cliente.

## Como rodar

Requisito: Node.js 18 ou superior.

```bash
npm install
npm run dev
```

Abra [http://localhost:5173/](http://localhost:5173/).

```bash
npm run build    # typecheck + bundle de produção
npm run preview  # serve a pasta dist
```

## Estrutura

```
src/
  App.tsx                 rotas
  context/                carrinho e autenticação
  data/products.ts        catálogo e categorias
  components/             header, footer, cards, layout
  pages/                  telas
public/products/          fotos dos itens
docs/especificacao.md     especificações
```

## Catálogo

Treze peças funcionais (vasos, utilitários, decoração, games, cutelaria e acessórios), com fotos em `public/products/`. Miniaturas são sempre quadradas para os cards ficarem do mesmo tamanho, mesmo quando a foto original é uma colagem vertical.

## Licença e contexto

Projeto acadêmico do LES (Laboratório de Engenharia de Software). As fotos de produto são material de referência para o catálogo de demonstração.

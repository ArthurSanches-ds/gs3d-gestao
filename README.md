# GS3D Gestão

[![CI](https://github.com/ArthurSanches-ds/gs3d-gestao/actions/workflows/ci.yml/badge.svg)](https://github.com/ArthurSanches-ds/gs3d-gestao/actions/workflows/ci.yml)

Sistema de gestão para a **GS3D Studio**, um negócio de impressão 3D em Rio das Ostras/RJ.
Substitui a planilha que controlava custos, preços, estoque e lucro, mantendo todas as regras de cálculo dela, agora testadas.

> **Status:** Fase 0 concluída (motor de cálculo, banco de dados e importação da planilha). Telas em desenvolvimento.

## O problema

Precificar impressão 3D direito é mais difícil do que parece. O custo de uma peça soma filamento de várias cores, energia, desgaste da impressora, mão de obra, insumos (argola, embalagem) e uma reserva para falhas. O preço ainda precisa absorver a comissão de cada marketplace, que muda conforme a faixa de preço, e a taxa da maquininha quando o cliente parcela.

Uma planilha resolve até certo ponto, mas não registra histórico, não dá baixa automática no estoque e não impede erro de digitação.

## Destaques técnicos

- **Motor de cálculo isolado e testado.** Toda regra de negócio fica em `src/domain`, em funções puras, sem depender de banco ou de tela. Os testes usam os números reais da planilha original como referência.
- **Dinheiro sem erro de arredondamento.** Os cálculos usam `decimal.js` em vez de `number`, porque `0.1 + 0.2` dá `0.30000000000000004` no JavaScript.
- **Faixas de taxa por preço.** O preço sugerido testa cada faixa de comissão do marketplace e escolhe a que fecha a conta, inclusive no caso em que nenhuma fecha e o preço precisa subir até o piso da próxima faixa.
- **Estoque como livro-razão.** Não existe coluna de "saldo" editável. O saldo é calculado a partir das movimentações (pesagem, compra, consumo, ajuste), como num extrato bancário.
- **Fotografia de custo na venda.** Cada venda guarda o custo e as taxas do momento, então mudar um parâmetro hoje não reescreve o lucro de meses passados.
- **Importação verificada.** Um script importa a planilha e outro confere que o saldo de cada filamento bate com ela, até a casa decimal.

## Stack

| Camada    | Tecnologia                                                 |
| --------- | ---------------------------------------------------------- |
| Framework | Next.js 16 (App Router) + TypeScript                       |
| Banco     | PostgreSQL no Neon (região São Paulo)                      |
| ORM       | Prisma 7 com adaptador do Neon                             |
| Testes    | Vitest                                                     |
| Qualidade | ESLint, Prettier, checagem de tipos e CI no GitHub Actions |

## Estrutura

```
src/
├── domain/          # Regras de negócio puras, sem banco e sem tela
│   ├── pricing/     # Custo por peça, preço por canal, maquininha, distribuição do lucro
│   └── stock/       # Saldo de filamento a partir das movimentações
├── lib/db.ts        # Conexão com o banco
└── app/             # Telas (Next.js)
prisma/
├── schema.prisma    # Modelo de dados
├── migrations/      # Histórico de mudanças do banco
└── seed.ts          # Importação dos dados da planilha
scripts/
└── check-stock.ts   # Confere o saldo do banco contra a planilha
```

## Como rodar

**Pré-requisitos:** Node.js 20.19+ e um banco PostgreSQL (o projeto usa o [Neon](https://neon.com)).

1. Instale as dependências:

```bash
   npm install
```

2. Crie um arquivo `.env` na raiz com as duas conexões do banco:

```bash
   DATABASE_URL="postgresql://..."           # conexão com pooling (usada pelo sistema)
   DATABASE_URL_UNPOOLED="postgresql://..."  # conexão direta (usada pelas migrações)
```

3. Crie as tabelas, gere o Prisma Client e importe os dados iniciais:

```bash
   npx prisma migrate deploy
   npx prisma generate
   npm run db:seed
```

4. Rode:

```bash
   npm run dev
```

## Scripts

| Comando               | O que faz                                                 |
| --------------------- | --------------------------------------------------------- |
| `npm run dev`         | Servidor de desenvolvimento                               |
| `npm test`            | Roda os testes                                            |
| `npm run test:watch`  | Roda os testes a cada arquivo salvo                       |
| `npm run typecheck`   | Confere os tipos do TypeScript                            |
| `npm run lint`        | Procura erros e más práticas                              |
| `npm run format`      | Formata o código                                          |
| `npm run db:seed`     | Importa os dados da planilha (pode rodar mais de uma vez) |
| `npm run check:stock` | Compara o saldo dos filamentos com a planilha             |

## Roadmap

- [x] **Fase 0:** motor de cálculo, banco de dados, importação da planilha e CI
- [ ] **Fase 1 (MVP):** telas de parâmetros, filamentos, insumos, produtos, produção, orçamento e vendas, com login para duas pessoas
- [ ] **Fase 2:** pedidos por encomenda (status, prazo, sinal de 50%) e cadastro de clientes
- [ ] **Fase 3:** fila de produção e dashboard com gráficos

## Autor

**Arthur Sanches**: [GitHub](https://github.com/ArthurSanches-ds)

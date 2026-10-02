# FinTrack

Aplicacao de gestao financeira pessoal desenvolvida como projeto de portfolio.

## Fase atual

Fase 1 - Arquitetura e dominio.

Esta etapa define:

- arquitetura modular do backend;
- estrutura inicial do frontend;
- entidades de dominio;
- relacionamentos principais;
- enums;
- regras de negocio;
- modelo relacional;
- migrations iniciais com Flyway.

Funcionalidades como autenticacao, endpoints REST, dashboard e telas completas serao implementadas nas proximas fases.

## Estrutura

```text
FinTrack
├── backend
├── frontend
├── docs
└── docker-compose.yml
```

## Como executar a infraestrutura

```bash
docker compose up -d postgres metabase
```

Guia rapido da conexao com o banco: [docs/banco-de-dados.md](docs/banco-de-dados.md).

## Requisitos locais

- Java 17+
- Node.js 20+
- PostgreSQL local ou Docker

O projeto tambem possui Maven portatil em `.tools/` durante o desenvolvimento local. Use:

```powershell
.\scripts\run-backend.cmd
```

## Decisoes principais

- O sistema usa monolito modular, evitando microservicos sem necessidade.
- `Movimentacao` representa somente fatos financeiros efetivamente ocorridos.
- `ContaAPagar`, `ContaAReceber` e `Parcela` representam compromissos previstos.
- `saldoAtual` nao e armazenado como fonte primaria. Ele sera calculado a partir de `saldoInicial` e movimentacoes efetivadas.
- Todos os registros financeiros pertencem a um `Usuario`.

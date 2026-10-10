# Histórico de versões

## 0.1.0 — 10/10/2026

- Contas financeiras, categorias, movimentações, compromissos, dashboard, relatórios e DRE com autenticação.
- Conferência de liquidação por data, preservação do valor histórico, bloqueio de alterações diretas e proteção contra confirmações simultâneas.
- Confirmação de exclusão/cancelamento, erros de negócio apresentados ao usuário e listas adaptadas a telas menores.
- Correção do menu de ações do Financeiro: as linhas da tabela mantêm sua identidade ao abrir menus e aplicar filtros.
- Rotas carregadas sob demanda e API configurada por ambiente; token enviado apenas à API autorizada.
- Perfil de produção com segredos obrigatórios, CORS configurável, healthcheck e implantação Docker com Nginx e PostgreSQL 16.
- Testes reais PostgreSQL, backup/restauração de ensaio e CI para backend/frontend/Docker.

A hospedagem e o domínio ainda precisam ser escolhidos. Fontes de renda e parcelamentos possuem estrutura de domínio, mas suas telas específicas ficam para uma próxima versão.

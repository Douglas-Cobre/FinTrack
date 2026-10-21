# FinTrack

Gestão financeira com Angular 18, Spring Boot 3.3, Java 17 e PostgreSQL. Versão 0.1.0. Para uso local simples, também aceita SQLite em um único arquivo `.db`.

## Funcionalidades disponíveis

- Cadastro e login com JWT; registros separados por usuário.
- Contas financeiras, categorias e movimentações de receita/despesa.
- Contas a pagar/receber com multa, juros e desconto configuráveis.
- Conferência do valor na data escolhida antes de pagar ou receber; proteção contra confirmações simultâneas.
- Dashboard, relatórios e DRE por período, com indicação de lançamentos sem classificação.
- Confirmação antes de excluir/cancelar, mensagens de validação e navegação para celular.

O saldo considera apenas movimentações efetivadas. Movimentações geradas por compromissos preservam a origem e não podem ser editadas/excluídas diretamente. Contas e categorias com vínculos também não podem ser excluídas. Classificar uma categoria na DRE altera a leitura dos períodos anteriores.

## Desenvolvimento local

Requisitos: Java 17, Node.js 22 e Maven 3.9. PostgreSQL 16 é necessário somente para o modo PostgreSQL. O script Maven usa a instalação portátil em `.tools/`, quando disponível, ou `mvn.cmd` do PATH.

No PowerShell, configure as credenciais locais:

```powershell
Copy-Item .env.example .env
# Edite .env e informe DB_PASSWORD; não versionar este arquivo.
```

Com PostgreSQL instalado, crie um banco vazio `fintrack`. Como alternativa, com Docker:

```powershell
docker compose up -d postgres
```

O Flyway aplica as migrações ao iniciar o backend:

```powershell
.\scripts\run-backend.ps1
```

Em outro terminal:

```powershell
Set-Location frontend
npm ci
npm start
```

Acesse `http://localhost:4200`. O servidor Angular encaminha `/api` para o backend por `frontend/proxy.conf.json`. A API local fica em `http://localhost:8080/api`; o Swagger de desenvolvimento em `http://localhost:8080/swagger-ui.html`.

## Uso local com arquivo `.db`

Para usar a aplicação sem instalar ou iniciar PostgreSQL, execute `scripts/run-backend-sqlite.ps1` no lugar de `scripts/run-backend.ps1`. O arquivo SQLite será criado em `backend/data/fintrack.db` e as tabelas serão preparadas automaticamente na primeira inicialização. Inicie o frontend como descrito acima e acesse `http://localhost:4200`.

O arquivo `.db` guarda os dados localmente e pode ser copiado para fazer backup ou levado para outro computador. Para abrir um arquivo em outro local, defina `FINTRACK_DB_FILE` antes de executar o script. Essa opção é para instalação local; a composição de produção continua usando PostgreSQL.

## Validação

```powershell
.\scripts\test-backend.ps1
.\scripts\test-postgres.ps1
Set-Location frontend
npm test
npm run build
```

O teste PostgreSQL cria bancos temporários, aplica migrações reais, testa concorrência e restaura um backup em outro banco vazio. Precisa das ferramentas PostgreSQL em `PG_BIN` ou na instalação Windows padrão e de um usuário local com permissão para criar bancos. Nunca aponta para o banco `fintrack`. Veja [validação](docs/validacao.md).

## Produção

[Guia de implantação e backup](docs/implantacao.md). A composição inclui PostgreSQL 16, backend com perfil `prod` e frontend servido por Nginx. O frontend usa `/api` na mesma origem. Senhas e chave JWT são obrigatórias; Swagger fica desabilitado.

```powershell
Copy-Item .env.production.example .env.production
# Configure DB_PASSWORD e JWT_SECRET antes de iniciar.
docker compose --env-file .env.production -f compose.production.yml up -d --build --wait
```

A instalação começa em `http://127.0.0.1:8088`. Para disponibilizá-la na internet, configure hospedagem, domínio e HTTPS seguindo o guia. A hospedagem ainda não foi escolhida.

A [CI](.github/workflows/ci.yml) executa testes, build, inicialização Docker, verificação HTTP e restauração de backup. Não publica a aplicação. O ambiente local atual não possui Docker; a execução completa dos contêineres precisa ser validada em uma máquina com Docker ou na CI.

## Documentação

- [Banco de dados](docs/banco-de-dados.md)
- [Arquitetura e domínio](docs/arquitetura-e-dominio.md)
- [Menus e funcionalidades](docs/menus-e-funcionalidades.md)
- [Histórico da versão](CHANGELOG.md)

O banco contém estruturas para fontes de renda e parcelamentos; as telas específicas desses módulos ainda não estão implementadas.

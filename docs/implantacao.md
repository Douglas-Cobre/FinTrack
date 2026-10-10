# Implantação e backup

## Preparar a instalação

Requisitos: Docker Engine/Desktop com Compose v2, Bash para os scripts de backup (Linux ou Git Bash no Windows) e espaço para o volume PostgreSQL e cópias de segurança.

1. Copie `.env.production.example` para `.env.production`.
2. Configure uma senha aleatória para `DB_PASSWORD` e uma chave aleatória de pelo menos 64 bytes para `JWT_SECRET`. Os valores `CHANGE_ME` são recusados na inicialização.
3. Mantenha `APP_BIND_ADDRESS=127.0.0.1` até configurar o acesso externo.
4. Execute:

```bash
docker compose --env-file .env.production -f compose.production.yml config --quiet
docker compose --env-file .env.production -f compose.production.yml up -d --build --wait
curl --fail http://127.0.0.1:8088/api/health
```

Exemplo de geração de chave com Python; copie a saída para o arquivo de ambiente privado:

```bash
python -c "import secrets; print(secrets.token_hex(64))"
```

O PostgreSQL não publica uma porta. O backend usa uma rede interna e aguarda a saúde do banco; o Nginx aguarda o backend. Os dados ficam no volume `fintrack-production_postgres-data`. Reiniciar/recriar contêineres preserva esse volume.

`config --quiet` valida a composição sem imprimir os segredos. Não compartilhe a saída completa de `docker compose config`.

## Hospedagem, domínio e HTTPS

A composição é independente do provedor. Em uma VPS, configure um proxy externo com certificado HTTPS apontando para `127.0.0.1:8088`; exponha somente as portas públicas desse proxy. Se o proxy também rodar em Docker, conecte-o à rede apropriada ou configure o acesso ao host.

O navegador acessa frontend e API no mesmo domínio. Por isso `CORS_ALLOWED_ORIGINS` pode ficar vazio. Se hospedar o frontend separado, altere `environment.production.ts` antes do build e informe no backend as origens completas autorizadas, separadas por vírgula; não use `*`. Reinicie o backend após modificar sua configuração e reconstrua o frontend após modificar seu endereço de API.

O Nginx recebe HTTP do proxy externo. O encaminhamento de protocolo reflete esse salto interno; ao adicionar funcionalidades que gerem URLs absolutas ou cookies, configure também a cadeia de proxies confiáveis e a propagação do protocolo HTTPS do provedor escolhido.

## Atualizar e verificar

Antes de atualizar: faça backup e teste a restauração. As migrações rodam automaticamente; mantenha o banco protegido durante mudanças de esquema.

```bash
bash scripts/backup-production.sh
docker compose --env-file .env.production -f compose.production.yml up -d --build --wait
docker compose --env-file .env.production -f compose.production.yml ps
curl --fail http://127.0.0.1:8088/api/health
```

Verifique cadastro/login, dashboard, navegação direta a `/financeiro`, DRE e uma confirmação financeira com dados de teste. Nunca use transações reais para validar a instalação.

O perfil `prod` exige credenciais, valida o esquema sem recriar tabelas, recusa chave JWT curta e CORS genérico, desabilita Swagger e omite detalhes internos nas respostas de erro. `/api/health` retorna apenas `UP` ou `DOWN`, incluindo a disponibilidade do banco.

## Backup e restauração de ensaio

No Bash, a partir da raiz:

```bash
bash scripts/backup-production.sh
bash scripts/verify-backup-production.sh backups/fintrack-ARQUIVO.dump
```

O primeiro comando cria um dump PostgreSQL no formato custom em `backups/`, com permissões restritas. O arquivo é copiado do contêiner, evitando problemas de redirecionamento binário no PowerShell. O segundo restaura em um banco temporário `fintrack_restore_*`, confere tabelas/histórico e remove apenas esse banco ao terminar. Não sobrescreve o banco em uso.

Configure `FINTRACK_ENV_FILE` e `FINTRACK_BACKUP_DIR` para caminhos alternativos. Agende o backup diário na hospedagem escolhida, copie os dumps para armazenamento separado com acesso restrito e teste a restauração periodicamente. Os scripts não apagam backups automaticamente; defina retenção conforme seu espaço e necessidade.

Restaurar sobre o banco em uso exige uma janela de manutenção e um plano de recuperação específico; o script de ensaio não executa essa operação.

## Limites da validação atual

Os testes locais verificaram o PostgreSQL 18.3 e a restauração com as ferramentas nativas. Docker não está instalado nesta máquina. A CI prepara uma instalação completa em PostgreSQL 16, testa o proxy/HTTP e executa os scripts Bash de backup. É preciso executar essa CI ou repetir seus comandos numa máquina com Docker antes da publicação.

Referências: [ordem de inicialização no Compose](https://docs.docker.com/compose/how-tos/startup-order/), [pg_dump](https://www.postgresql.org/docs/16/app-pgdump.html), [pg_restore](https://www.postgresql.org/docs/16/app-pgrestore.html).

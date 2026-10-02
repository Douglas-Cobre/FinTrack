# FinTrack - Arquitetura e dominio

## Decisao arquitetural

O FinTrack sera desenvolvido como monolito modular. Essa abordagem mantem um unico deploy Spring Boot, mas separa o codigo por modulos de negocio.

Alternativas avaliadas:

## Opcao A - Monolito modular

Vantagens:

- menor complexidade operacional;
- melhor para aprendizado e portfolio full stack;
- facilita transacoes consistentes entre contas, parcelas e movimentacoes;
- permite evoluir para modulos mais independentes no futuro.

Desvantagens:

- exige disciplina para nao misturar responsabilidades entre modulos.

## Opcao B - Microservicos

Vantagens:

- maior independencia de deploy por servico;
- escala isolada por contexto.

Desvantagens:

- complexidade desnecessaria nesta fase;
- exige mensageria, observabilidade e consistencia distribuida;
- aumenta o custo de desenvolvimento sem resolver um problema atual.

## Recomendacao

Usar monolito modular. E a escolha mais coerente para a fase inicial, preservando qualidade sem overengineering.

## Modulos

```text
backend/src/main/java/com/fintrack
├── autenticacao
├── usuario
├── conta
├── categoria
├── fonte
├── movimentacao
├── compromisso
├── parcelamento
├── dashboard
├── relatorio
└── shared
```

`compromisso` agrupa contas a pagar e contas a receber porque as duas representam obrigacoes ou expectativas futuras com ciclo de vencimento e efetivacao parecido. A separacao conceitual continua existindo em entidades distintas: `ContaAPagar` e `ContaAReceber`.

## Entidades

### Usuario

Representa o dono dos dados financeiros e a identidade usada na autenticacao.

Campos:

- id
- nome
- email
- senhaHash
- createdAt
- updatedAt

### ContaFinanceira

Representa onde o dinheiro esta armazenado.

Campos:

- id
- nome
- tipo
- saldoInicial
- usuario
- createdAt
- updatedAt

`saldoAtual` nao sera armazenado. Ele sera calculado por:

```text
saldoInicial + receitas efetivadas - despesas efetivadas
```

### Categoria

Classifica movimentacoes como receita ou despesa.

Campos:

- id
- nome
- tipo
- usuario
- createdAt
- updatedAt

Regra: uma movimentacao de despesa nao pode usar categoria de receita, e vice-versa.

### FonteDeRenda

Representa uma origem esperada de renda, sem ser uma entrada efetiva de dinheiro.

Campos:

- id
- nome
- tipo
- valorEsperado
- periodicidade
- diaPrevisto
- usuario
- createdAt
- updatedAt

### Movimentacao

Representa um fato financeiro ocorrido.

Campos:

- id
- descricao
- valor
- tipo
- data
- contaFinanceira
- categoria
- usuario
- origemTipo
- origemId
- createdAt
- updatedAt

`origemTipo` e `origemId` permitem rastrear quando a movimentacao nasceu de uma conta a pagar, conta a receber ou parcela. Essa escolha evita acoplamento JPA circular prematuro entre todos os modulos, mas preserva rastreabilidade.

### ContaAPagar

Representa obrigacao financeira futura.

Campos:

- id
- descricao
- valor
- dataVencimento
- status
- contaFinanceira
- categoria
- movimentacao
- usuario
- createdAt
- updatedAt

Regra: ao pagar, deve gerar uma unica movimentacao de tipo `DESPESA`.

### ContaAReceber

Representa valor esperado a receber.

Campos:

- id
- descricao
- valor
- dataVencimento
- status
- contaFinanceira
- categoria
- fonteDeRenda
- movimentacao
- usuario
- createdAt
- updatedAt

Regra: ao receber, deve gerar uma unica movimentacao de tipo `RECEITA`.

### Parcelamento

Agrupa parcelas geradas no cadastro de uma compra ou compromisso parcelado.

Campos:

- id
- descricao
- valorTotal
- quantidadeParcelas
- usuario
- createdAt
- updatedAt

### Parcela

Representa cada vencimento individual de um parcelamento.

Campos:

- id
- parcelamento
- numero
- quantidadeTotal
- valor
- dataVencimento
- status
- contaFinanceira
- categoria
- movimentacao
- usuario
- createdAt
- updatedAt

Regra: uma parcela paga gera no maximo uma movimentacao.

## Enums

- `TipoMovimentacao`: `RECEITA`, `DESPESA`
- `TipoContaFinanceira`: `CONTA_CORRENTE`, `POUPANCA`, `DINHEIRO`, `INVESTIMENTO`, `OUTRA`
- `TipoFonteDeRenda`: `FIXA`, `VARIAVEL`
- `Periodicidade`: `MENSAL`, `SEMANAL`, `ANUAL`, `EVENTUAL`
- `StatusContaAPagar`: `PENDENTE`, `PAGA`, `ATRASADA`, `CANCELADA`
- `StatusContaAReceber`: `PENDENTE`, `RECEBIDA`, `ATRASADA`, `CANCELADA`
- `StatusParcela`: `PENDENTE`, `PAGA`, `ATRASADA`, `CANCELADA`
- `OrigemMovimentacaoTipo`: `MANUAL`, `CONTA_A_PAGAR`, `CONTA_A_RECEBER`, `PARCELA`

## Regras de negocio principais

- Todo recurso financeiro pertence a um usuario.
- Um usuario nao pode acessar dados financeiros de outro usuario.
- Movimentacoes registram fatos financeiros efetivamente ocorridos.
- Contas a pagar, contas a receber e parcelas permanecem como historico depois da efetivacao.
- A efetivacao de um compromisso deve criar uma movimentacao vinculada.
- A mesma conta a pagar, conta a receber ou parcela nao pode gerar mais de uma movimentacao.
- Categorias devem ser compativeis com o tipo da movimentacao.
- Valores monetarios devem ser positivos.
- `saldoAtual` deve ser calculado, nao persistido como verdade primaria.
- `saldoProjetado` sera calculado a partir do saldo atual mais recebiveis pendentes menos pagamentos pendentes.

## DER em texto

```text
Usuario 1 ── N ContaFinanceira
Usuario 1 ── N Categoria
Usuario 1 ── N FonteDeRenda
Usuario 1 ── N Movimentacao
Usuario 1 ── N ContaAPagar
Usuario 1 ── N ContaAReceber
Usuario 1 ── N Parcelamento

ContaFinanceira 1 ── N Movimentacao
Categoria 1 ── N Movimentacao

ContaFinanceira 1 ── N ContaAPagar
Categoria 1 ── N ContaAPagar
ContaAPagar 0..1 ── 0..1 Movimentacao

ContaFinanceira 1 ── N ContaAReceber
Categoria 1 ── N ContaAReceber
FonteDeRenda 0..1 ── N ContaAReceber
ContaAReceber 0..1 ── 0..1 Movimentacao

Parcelamento 1 ── N Parcela
ContaFinanceira 1 ── N Parcela
Categoria 1 ── N Parcela
Parcela 0..1 ── 0..1 Movimentacao
```

## Modelo relacional inicial

```text
usuarios
contas_financeiras
categorias
fontes_de_renda
movimentacoes
contas_a_pagar
contas_a_receber
parcelamentos
parcelas
```

As tabelas possuem `usuario_id` para isolamento de dados e auditoria basica com `created_at` e `updated_at`.

## Ambiguidades para decidir nas proximas fases

- Se categorias padrao serao globais, copiadas por usuario no cadastro ou criadas manualmente.
- Se `ContaAPagar` e `ContaAReceber` devem aceitar recorrencia diretamente ou se a recorrencia tera entidade propria.
- Se parcelamentos serao inicialmente apenas despesas ou tambem poderao representar recebimentos parcelados.
- Se a efetivacao de conta a pagar/receber permitira informar data e valor diferentes do previsto.
- Se o dashboard inicial sera calculado via repositories simples ou queries especificas de projecao.

# Menus e funcionalidades

## Dashboard — `/`

Mostra o usuário autenticado, saldos das contas, receitas e despesas do resumo financeiro, últimos lançamentos e compromissos futuros. Continua consumindo `GET /api/relatorios/resumo`.

## Contas financeiras — `/contas`

Cadastro, listagem, edição e exclusão de contas. O saldo atual é calculado pelo saldo inicial mais receitas efetivadas menos despesas efetivadas.

## Movimentações — `/movimentacoes`

Cadastro, listagem, edição e exclusão de receitas e despesas efetivadas. A categoria é opcional; quando informada, deve pertencer ao usuário e ser compatível com o tipo da movimentação.

## Categorias — `/categorias`

Cadastro, listagem, edição e exclusão de categorias de receita ou despesa. O seletor **Grupo da DRE** oferece somente grupos compatíveis com o tipo, além de **Sem classificação** e **Fora da DRE**.

Categorias sem grupo continuam válidas e aparecem como não classificadas. Alterar o grupo modifica também a DRE de períodos anteriores. Se o tipo for alterado, um grupo incompatível é removido do formulário; revise a seleção antes de salvar.

## Financeiro — `/financeiro`

Reúne contas a pagar e a receber, com filtros por tipo, cadastro, edição, cancelamento, exclusão e efetivação. A configuração financeira define valores padrão para juros, multa e desconto. A efetivação cria uma movimentação vinculada; compromissos pendentes não entram no resultado por caixa. As rotas antigas `/contas-a-pagar` e `/contas-a-receber` redirecionam para esta tela.

Ao clicar em **Pagar** ou **Receber**, uma janela permite escolher a data e conferir valor original, multa, juros, desconto e total. A data inicial usa o dia local do navegador. Alterar a data cancela a consulta anterior e recalcula a prévia no backend; somente a prévia vigente pode ser confirmada. Durante o registro, os controles ficam bloqueados para evitar cliques repetidos. Se o valor tiver mudado desde a conferência, a API exige uma nova consulta.

Compromissos são criados como pendentes. A edição preserva o status; somente as operações próprias de pagamento, recebimento e cancelamento podem alterá-lo. Compromissos liquidados não podem ser editados, cancelados ou excluídos, e suas movimentações não permitem alterações diretas na tela de Movimentações. Compromissos cancelados não permitem edição ou efetivação.

O valor de um compromisso liquidado permanece igual ao valor realmente pago ou recebido. Juros e multa incidem após o vencimento; o desconto segue a janela de antecedência cadastrada (0 aplica apenas no vencimento). Cada componente é arredondado para centavos com `HALF_UP`, e o total corresponde à soma dos componentes exibidos. Efetivações com valor zero ou negativo são recusadas. Estorno e liquidação parcial ainda não fazem parte deste fluxo.

## Relatórios — `/relatorios`

Mantém os gráficos e tabelas por categoria, indicadores e ordenação existentes, usando `GET /api/relatorios/resumo`. Esse resumo permanece acumulado, sem filtros ou regras da DRE.

## DRE gerencial — `/dre`

Componente independente, acessível pelo item **DRE** próximo de **Relatórios**.

- Identifica **Regime de caixa — valores recebidos e pagos no período**.
- Abre no mês corrente do navegador e permite intervalo inclusivo de datas, aplicado por **Consultar**.
- Exibe sete grupos e cinco subtotais na ordem da apuração, inclusive zeros; grupos com valores podem ser expandidos por categoria.
- Exibe carregamento, período vazio, erro com tentativa novamente e aviso de resultado incompleto.
- Mostra quantidade e valores de receitas/despesas sem classificação e oferece acesso às categorias e movimentações.
- Mostra separadamente receitas/despesas classificadas como `FORA_DRE`, excluídas intencionalmente dos subtotais.
- Cancela consultas anteriores e limpa o resultado ao editar o período, impedindo que dados antigos sejam apresentados para outro filtro.
- Em telas pequenas, o menu abre pelo botão **Menu** e a tabela tem rolagem horizontal somente quando necessária.

### Como utilizar

1. Revise o **Grupo da DRE** em Categorias. A classificação é explícita, sem inferência pelo nome.
2. Nas movimentações sem categoria, associe uma categoria se o valor deve compor a DRE.
3. Abra DRE, escolha o período e clique em Consultar.
4. Expanda os grupos para conferir as categorias e revise as pendências até a apuração ficar completa.

### Limitações da entrega por caixa

A apuração usa a classificação atual da categoria, inclusive no histórico. Movimentações cujo tipo histórico ficou incompatível com o grupo atual também geram pendência. Não classificados e `FORA_DRE` não compõem o resultado; os totais separados permitem reconciliar todas as movimentações por tipo.

Juros, multas e descontos da efetivação de compromissos integram uma única movimentação. O valor inteiro segue a categoria dessa movimentação. Esta tela não representa apuração contábil por competência.

## Evoluções pendentes

Regime de competência depende de lançamentos próprios de reconhecimento, classificação histórica, idempotência, componentes separados e estornos, conforme `plano-implementacao-dre.md`. Comparações mensais, análise percentual e exportações PDF/Excel não fazem parte da entrega inicial. Parcelamentos possuem entidades, mas ainda não têm um fluxo próprio completo no menu.

# Menus e funcionalidades

## Implementados

### Dashboard

Rota:

```text
/
```

Mostra o usuario autenticado e estados vazios enquanto nao existem dados financeiros suficientes.

### Contas financeiras

Rota:

```text
/contas
```

Funcionalidades:

- cadastrar;
- listar;
- editar;
- excluir;
- consultar saldo inicial e saldo atual calculado.

### Categorias

Rota:

```text
/categorias
```

Funcionalidades:

- cadastrar categoria de receita ou despesa;
- listar;
- editar;
- excluir.

### Movimentacoes

Rota:

```text
/movimentacoes
```

Funcionalidades:

- cadastrar receita ou despesa efetivada;
- listar;
- editar;
- excluir;
- validar que a categoria pertence ao mesmo tipo da movimentacao.

## Ainda pendentes

### Contas a pagar

Rota:

```text
/contas-a-pagar
```

Faltam metodos de backend para:

- cadastrar;
- listar;
- editar;
- cancelar;
- marcar como paga;
- gerar movimentacao de despesa;
- impedir pagamento duplicado.

### Contas a receber

Rota:

```text
/contas-a-receber
```

Faltam metodos de backend para:

- cadastrar;
- listar;
- editar;
- cancelar;
- marcar como recebida;
- gerar movimentacao de receita;
- impedir recebimento duplicado.

### Relatorios

Rota:

```text
/relatorios
```

Faltam consultas agregadas e endpoints especificos para relatorios.

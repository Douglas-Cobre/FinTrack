ALTER TABLE contas_a_pagar
    ADD COLUMN multa_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0,
    ADD COLUMN juros_dia_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0,
    ADD COLUMN desconto_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0,
    ADD COLUMN desconto_dias_antes INTEGER NOT NULL DEFAULT 0;

ALTER TABLE contas_a_receber
    ADD COLUMN multa_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0,
    ADD COLUMN juros_dia_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0,
    ADD COLUMN desconto_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0,
    ADD COLUMN desconto_dias_antes INTEGER NOT NULL DEFAULT 0;

ALTER TABLE contas_a_pagar
    ADD CONSTRAINT ck_contas_a_pagar_config_percentuais CHECK (
        multa_percentual >= 0
        AND juros_dia_percentual >= 0
        AND desconto_percentual >= 0
        AND desconto_percentual <= 100
    ),
    ADD CONSTRAINT ck_contas_a_pagar_desconto_dias CHECK (desconto_dias_antes >= 0);

ALTER TABLE contas_a_receber
    ADD CONSTRAINT ck_contas_a_receber_config_percentuais CHECK (
        multa_percentual >= 0
        AND juros_dia_percentual >= 0
        AND desconto_percentual >= 0
        AND desconto_percentual <= 100
    ),
    ADD CONSTRAINT ck_contas_a_receber_desconto_dias CHECK (desconto_dias_antes >= 0);

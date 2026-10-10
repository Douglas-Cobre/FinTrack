CREATE TABLE configuracoes_financeiras (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    multa_percentual NUMERIC(7, 4) NOT NULL DEFAULT 2,
    juros_dia_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0.03,
    desconto_percentual NUMERIC(7, 4) NOT NULL DEFAULT 0,
    desconto_dias_antes INTEGER NOT NULL DEFAULT 0,
    usuario_id UUID NOT NULL UNIQUE REFERENCES usuarios(id),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT ck_configuracoes_financeiras_percentuais CHECK (
        multa_percentual >= 0
        AND juros_dia_percentual >= 0
        AND desconto_percentual >= 0
        AND desconto_percentual <= 100
    ),
    CONSTRAINT ck_configuracoes_financeiras_desconto_dias CHECK (desconto_dias_antes >= 0)
);


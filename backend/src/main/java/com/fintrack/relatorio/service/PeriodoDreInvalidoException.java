package com.fintrack.relatorio.service;

public class PeriodoDreInvalidoException extends RuntimeException {
    public PeriodoDreInvalidoException() {
        super("Informe inicio e fim validos; a data inicial deve ser anterior ou igual a data final.");
    }
}

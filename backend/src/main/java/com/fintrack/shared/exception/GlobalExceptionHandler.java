package com.fintrack.shared.exception;

import jakarta.servlet.http.HttpServletRequest;
import com.fintrack.relatorio.service.PeriodoDreInvalidoException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(PeriodoDreInvalidoException.class)
    public ResponseEntity<ApiError> handlePeriodoDre(PeriodoDreInvalidoException exception, HttpServletRequest request) {
        return criarResposta(HttpStatus.BAD_REQUEST, exception.getMessage(), request.getRequestURI(), Map.of());
    }

    @ExceptionHandler({MissingServletRequestParameterException.class, MethodArgumentTypeMismatchException.class})
    public ResponseEntity<ApiError> handleParametros(Exception exception, HttpServletRequest request) {
        return criarResposta(HttpStatus.BAD_REQUEST,
                "Parametros invalidos ou ausentes. Informe as datas no formato AAAA-MM-DD.",
                request.getRequestURI(), Map.of());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        Map<String, String> campos = new LinkedHashMap<>();

        for (FieldError fieldError : exception.getBindingResult().getFieldErrors()) {
            campos.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        return criarResposta(
                HttpStatus.BAD_REQUEST,
                "Dados invalidos.",
                request.getRequestURI(),
                campos
        );
    }

    @ExceptionHandler(RegraNegocioException.class)
    public ResponseEntity<ApiError> handleRegraNegocio(
            RegraNegocioException exception,
            HttpServletRequest request
    ) {
        return criarResposta(HttpStatus.CONFLICT, exception.getMessage(), request.getRequestURI(), Map.of());
    }

    @ExceptionHandler(CredenciaisInvalidasException.class)
    public ResponseEntity<ApiError> handleCredenciaisInvalidas(
            CredenciaisInvalidasException exception,
            HttpServletRequest request
    ) {
        return criarResposta(HttpStatus.UNAUTHORIZED, exception.getMessage(), request.getRequestURI(), Map.of());
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<ApiError> handleIntegridade(Exception exception, HttpServletRequest request) {
        return criarResposta(HttpStatus.CONFLICT,
                "A operacao conflita com registros vinculados ou dados ja cadastrados. Atualize a lista e confira os dados.",
                request.getRequestURI(), Map.of());
    }

    @ExceptionHandler(org.springframework.http.converter.HttpMessageNotReadableException.class)
    public ResponseEntity<ApiError> handleJson(Exception exception, HttpServletRequest request) {
        return criarResposta(HttpStatus.BAD_REQUEST, "Dados invalidos. Confira os valores, tipos e datas enviados.",
                request.getRequestURI(), Map.of());
    }

    private ResponseEntity<ApiError> criarResposta(
            HttpStatus status,
            String mensagem,
            String path,
            Map<String, String> campos
    ) {
        var body = new ApiError(
                OffsetDateTime.now(),
                status.value(),
                status.getReasonPhrase(),
                mensagem,
                path,
                campos
        );

        return ResponseEntity.status(status).body(body);
    }
}

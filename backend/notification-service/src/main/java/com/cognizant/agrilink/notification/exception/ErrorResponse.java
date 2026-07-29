package com.cognizant.agrilink.notification.exception;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.LocalDateTime;
import java.util.Map;
import org.springframework.http.HttpStatus;

/**
 * Standard error payload returned for every exception handled by
 * {@link GlobalExceptionHandler}, so all endpoints in this service fail in a
 * consistent, machine-readable shape.
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
        LocalDateTime timestamp,
        int status,
        String error,
        String message,
        String path,
        Map<String, String> details) {

    public static ErrorResponse of(HttpStatus status, String message, String path) {
        return new ErrorResponse(LocalDateTime.now(), status.value(),
                status.getReasonPhrase(), message, path, null);
    }

    public static ErrorResponse of(HttpStatus status, String message, String path,
            Map<String, String> details) {
        return new ErrorResponse(LocalDateTime.now(), status.value(),
                status.getReasonPhrase(), message, path, details);
    }
}

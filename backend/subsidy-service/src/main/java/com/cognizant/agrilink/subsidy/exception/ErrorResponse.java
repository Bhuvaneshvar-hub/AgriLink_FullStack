package com.cognizant.agrilink.subsidy.exception;

/**
 * Standard error payload returned for every exception handled by
 * {@link GlobalExceptionHandler}. Only the human-readable message is exposed to
 * the caller, so all endpoints in this service fail in a consistent shape.
 */
public record ErrorResponse(String message) {

    public static ErrorResponse of(String message) {
        return new ErrorResponse(message);
    }
}

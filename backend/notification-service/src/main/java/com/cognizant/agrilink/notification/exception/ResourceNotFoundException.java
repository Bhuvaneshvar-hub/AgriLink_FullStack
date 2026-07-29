package com.cognizant.agrilink.notification.exception;

import jakarta.persistence.EntityNotFoundException;

/**
 * Thrown by the service layer when a requested domain resource does not exist.
 *
 * <p>It extends {@link EntityNotFoundException} so that the not-found semantics
 * (and the existing service tests that assert on it) continue to hold, while
 * giving this module its own, intention-revealing exception type. It is never
 * handled inside a service or controller: {@link GlobalExceptionHandler}
 * translates it into an HTTP 404 response.</p>
 */
public class ResourceNotFoundException extends EntityNotFoundException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}

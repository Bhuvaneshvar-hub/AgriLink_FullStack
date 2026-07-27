package com.cognizant.agrilink.iam.exception;

/**
 * Thrown when an authenticated caller is not allowed to perform an action
 * (e.g. an ExtensionOfficer trying to create a non-Farmer account).
 */
public class ForbiddenException extends RuntimeException {
    public ForbiddenException(String message) {
        super(message);
    }
}

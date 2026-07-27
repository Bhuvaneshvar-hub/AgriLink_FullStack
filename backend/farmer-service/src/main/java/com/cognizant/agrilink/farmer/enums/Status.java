package com.cognizant.agrilink.farmer.enums;

/**
 * Lifecycle status shared by farmer domain entities.
 *
 * <ul>
 *   <li>{@code AC} - Active</li>
 *   <li>{@code IN} - Inactive</li>
 * </ul>
 *
 * <p>Persisted as the 2-letter constant name via {@code @Enumerated(EnumType.STRING)}.</p>
 */
public enum Status {
    /** Active. */
    AC,
    /** Inactive. */
    IN
}

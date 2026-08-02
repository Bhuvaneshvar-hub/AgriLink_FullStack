package com.cognizant.agrilink.farmer.enums;

/**
 * Lifecycle status shared by farmer domain entities.
 *
 * <ul>
 *   <li>{@code AC} - Active</li>
 *   <li>{@code IN} - Inactive</li>
 *   <li>{@code VE} - Verified (a farmer profile whose identity/land records an
 *       officer or admin has validated)</li>
 *   <li>{@code PE} - Pending approval (land holdings submitted by a farmer)</li>
 *   <li>{@code DP} - Disputed (a land holding an admin rejected)</li>
 * </ul>
 *
 * <p>Persisted as the 2-letter constant name via {@code @Enumerated(EnumType.STRING)}.</p>
 */
public enum Status {
    /** Active. */
    AC,
    /** Inactive. */
    IN,
    /** Verified. */
    VE,
    /** Pending approval. */
    PE,
    /** Disputed. */
    DP
}

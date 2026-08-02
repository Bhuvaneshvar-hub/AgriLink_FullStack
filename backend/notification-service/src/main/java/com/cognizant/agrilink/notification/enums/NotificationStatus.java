package com.cognizant.agrilink.notification.enums;

/**
 * Read/unread state of a {@code Notification}.
 *
 * <p>Persisted as the 2-letter constant name via {@code @Enumerated(EnumType.STRING)}.</p>
 * <ul>
 *   <li>{@code UN} - Unread</li>
 *   <li>{@code RD} - Read</li>
 *   <li>{@code DI} - Dismissed (hidden by the recipient; retained for audit)</li>
 * </ul>
 */
public enum NotificationStatus {
    /** Unread. */
    UN,
    /** Read. */
    RD,
    /** Dismissed. */
    DI
}

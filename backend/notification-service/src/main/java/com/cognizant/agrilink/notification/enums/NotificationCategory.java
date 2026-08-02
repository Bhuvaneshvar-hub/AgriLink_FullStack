package com.cognizant.agrilink.notification.enums;

/**
 * Business category a {@code Notification} belongs to, matching the AgriLink
 * design document (section 4.8).
 *
 * <p>Persisted as the constant name via {@code @Enumerated(EnumType.STRING)} and
 * serialized to JSON with the same descriptive name (e.g. {@code "CropAdvisory"}).</p>
 * <ul>
 *   <li>{@code CropAdvisory} - sowing reminders, pest alerts, harvest deadlines</li>
 *   <li>{@code Subsidy} - scheme approval / disbursement / closure updates</li>
 *   <li>{@code InputProcurement} - input request and delivery updates</li>
 *   <li>{@code ProduceSale} - produce listing / buyer match / payment updates</li>
 *   <li>{@code Compliance} - audit, validation and system/administrative alerts</li>
 * </ul>
 */
public enum NotificationCategory {
    /** Crop advisory alerts (sowing, pest, harvest). */
    CropAdvisory,
    /** Subsidy and scheme updates. */
    Subsidy,
    /** Input procurement and delivery updates. */
    InputProcurement,
    /** Produce sale and market linkage updates. */
    ProduceSale,
    /** Compliance and system/administrative alerts. */
    Compliance
}
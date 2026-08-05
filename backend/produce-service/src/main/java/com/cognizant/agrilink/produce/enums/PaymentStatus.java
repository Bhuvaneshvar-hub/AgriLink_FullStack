package com.cognizant.agrilink.produce.enums;

/**
 * Payment status of a produce sale. Persisted as the 2-letter constant name.
 * <ul>
 *   <li>{@code PE} - Pending</li>
 *   <li>{@code PD} - Paid</li>
 *   <li>{@code OV} - Overdue (retired: no longer offered when recording a sale,
 *       retained so rows persisted before its removal still deserialize)</li>
 * </ul>
 */
public enum PaymentStatus {
    PE,
    PD,
    OV
}

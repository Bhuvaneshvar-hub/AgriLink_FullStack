package com.cognizant.agrilink.produce.enums;

/**
 * Payment status of a produce sale. Persisted as the 2-letter constant name.
 * <ul>
 *   <li>{@code PE} - Pending</li>
 *   <li>{@code PD} - Paid</li>
 *   <li>{@code OV} - Overdue</li>
 * </ul>
 */
public enum PaymentStatus {
    PE,
    PD,
    OV
}

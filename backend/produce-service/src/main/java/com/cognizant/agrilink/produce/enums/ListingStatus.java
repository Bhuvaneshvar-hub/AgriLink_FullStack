package com.cognizant.agrilink.produce.enums;

/**
 * Status of a produce listing. Persisted as the 2-letter constant name.
 * <ul>
 *   <li>{@code AV} - Available</li>
 *   <li>{@code PB} - PartiallyBooked</li>
 *   <li>{@code SO} - Sold</li>
 *   <li>{@code WD} - Withdrawn</li>
 * </ul>
 */
public enum ListingStatus {
    AV,
    PB,
    SO,
    WD
}

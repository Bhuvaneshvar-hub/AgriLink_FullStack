package com.cognizant.agrilink.crop.enums;

/**
 * Lifecycle status for a crop plan, tracking its progress across the season.
 *
 * <ul>
 *   <li>{@code PLANNED} - plan created, not yet sown</li>
 *   <li>{@code SOWING} - sowing in progress</li>
 *   <li>{@code GROWING} - crop growing in the field</li>
 *   <li>{@code HARVESTED} - crop harvested</li>
 *   <li>{@code FAILED} - crop failed (pest, weather, etc.)</li>
 * </ul>
 *
 * <p>Persisted as the constant name via {@code @Enumerated(EnumType.STRING)}.</p>
 */
public enum PlanStatus {
	PLANNED,
	SOWING,
	GROWING,
	HARVESTED,
	FAILED
}

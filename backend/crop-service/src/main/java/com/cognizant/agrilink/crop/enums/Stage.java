package com.cognizant.agrilink.crop.enums;

/**
 * Growth observation stage. Declaration order defines the strict forward-only
 * flow enforced by the service layer (PL -> SO -> GR -> HA).
 *
 * <ul>
 *   <li>{@code PL} - Planned</li>
 *   <li>{@code SO} - Sowing</li>
 *   <li>{@code GR} - Growing</li>
 *   <li>{@code HA} - Harvesting</li>
 * </ul>
 */
public enum Stage {
	PL,
	SO,
	GR,
	HA
}

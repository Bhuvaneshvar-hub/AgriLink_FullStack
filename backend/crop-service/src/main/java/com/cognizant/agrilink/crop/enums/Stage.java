package com.cognizant.agrilink.crop.enums;

/**
 * Crop growth-observation stage. Declaration order defines the strict
 * forward-only progression enforced by the service layer
 * (GERMINATION -> VEGETATIVE -> FLOWERING -> MATURITY).
 *
 * <ul>
 *   <li>{@code GERMINATION} - seed sprouting / emergence</li>
 *   <li>{@code VEGETATIVE} - leaf and stem growth</li>
 *   <li>{@code FLOWERING} - flowering / reproductive phase</li>
 *   <li>{@code MATURITY} - grain/fruit maturity, ready for harvest</li>
 * </ul>
 */
public enum Stage {
	GERMINATION,
	VEGETATIVE,
	FLOWERING,
	MATURITY
}

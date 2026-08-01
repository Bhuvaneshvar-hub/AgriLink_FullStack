package com.cognizant.agrilink.crop.enums;

import java.util.Arrays;
import java.util.Optional;

/**
 * The agricultural growing seasons a crop catalog entry or crop plan may belong to.
 *
 * <p>Stored in the database as its display label (e.g. {@code "Kharif"}), so this
 * enum is used purely for validation/normalisation rather than as a JPA
 * {@code @Enumerated} column. Use {@link #fromLabel(String)} to parse an incoming
 * value case-insensitively and {@link #getLabel()} to obtain the canonical form.</p>
 */
public enum Season {
	KHARIF("Kharif"),
	RABI("Rabi"),
	ZAID("Zaid"),
	PERENNIAL("Perennial");

	private final String label;

	Season(String label) {
		this.label = label;
	}

	public String getLabel() {
		return label;
	}

	/**
	 * Parse a season label case-insensitively.
	 *
	 * @param value the incoming season string (e.g. "kharif", "KHARIF", "Kharif")
	 * @return the matching {@link Season}, or empty if the value is null/blank/unknown
	 */
	public static Optional<Season> fromLabel(String value) {
		if (value == null || value.isBlank()) {
			return Optional.empty();
		}
		String trimmed = value.trim();
		return Arrays.stream(values())
				.filter(s -> s.label.equalsIgnoreCase(trimmed))
				.findFirst();
	}

	public static boolean isValid(String value) {
		return fromLabel(value).isPresent();
	}
}

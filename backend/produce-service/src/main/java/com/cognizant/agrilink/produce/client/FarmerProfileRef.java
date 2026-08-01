package com.cognizant.agrilink.produce.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Minimal projection of a FarmerProfile as returned by farmer-service.
 * Only the identifiers needed for ownership checks are mapped; any other
 * fields in the response are ignored.
 */
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class FarmerProfileRef {

	private Integer farmerId;
	private Integer userId;
}

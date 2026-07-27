package com.cognizant.agrilink.report.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class LandHoldingDto {
	private Integer holdingId;
	private Integer farmerId;
	private String surveyNumber;
	private Double areaAcres;
	private String soilType;
	private String irrigationSource;
	private String ownershipType;
	private String status;
}

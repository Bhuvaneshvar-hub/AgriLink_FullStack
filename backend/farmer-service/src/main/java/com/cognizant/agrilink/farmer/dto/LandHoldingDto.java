package com.cognizant.agrilink.farmer.dto;

import com.cognizant.agrilink.farmer.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandHoldingDto {

	private Integer holdingId;
	private Integer farmerId;
	private String surveyNumber;
	private Double areaAcres;
	private String soilType;
	private String irrigationSource;
	private String ownershipType;
	private Status status;
}

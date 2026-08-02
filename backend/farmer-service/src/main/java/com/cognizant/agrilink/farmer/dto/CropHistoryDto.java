package com.cognizant.agrilink.farmer.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropHistoryDto {

	private Integer historyId;
	private Integer holdingId;
	private Integer farmerId;
	private String cropName;
	private String season;
	private Integer cropYear;
	private Double areaAcres;
	private Double yieldQuintals;
	private String remarks;
}

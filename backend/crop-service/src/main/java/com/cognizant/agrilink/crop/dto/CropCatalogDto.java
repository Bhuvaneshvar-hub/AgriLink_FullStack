package com.cognizant.agrilink.crop.dto;

import com.cognizant.agrilink.crop.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropCatalogDto {

	private Integer cropId;
	private String cropName;
	private String category;
	private String season;
	private Integer typicalDurationDays;
	private Double expectedYieldPerAcre;
	private Status status;
}

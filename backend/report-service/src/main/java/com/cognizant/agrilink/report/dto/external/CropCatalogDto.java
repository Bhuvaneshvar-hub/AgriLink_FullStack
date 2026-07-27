package com.cognizant.agrilink.report.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CropCatalogDto {
	private Integer cropId;
	private String cropName;
	private String variety;
	private String growingSeason;
	private Integer maturityDays;
	private String expectedYield;
}

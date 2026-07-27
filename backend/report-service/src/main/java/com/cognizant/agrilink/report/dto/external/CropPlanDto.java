package com.cognizant.agrilink.report.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class CropPlanDto {
	private Integer planId;
	private Integer farmerId;
	private Integer holdingId;
	private Integer cropId;
	private String season;
	private Integer year;
	private LocalDate sowingDate;
	private LocalDate expectedHarvestDate;
	private Double areaPlanted;
	private String status;
}

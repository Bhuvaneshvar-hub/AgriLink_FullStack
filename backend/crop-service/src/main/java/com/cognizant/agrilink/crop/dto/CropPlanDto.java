package com.cognizant.agrilink.crop.dto;

import com.cognizant.agrilink.crop.enums.PlanStatus;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
	private PlanStatus status;
}

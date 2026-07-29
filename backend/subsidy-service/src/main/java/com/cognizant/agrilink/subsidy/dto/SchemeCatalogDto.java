package com.cognizant.agrilink.subsidy.dto;

import com.cognizant.agrilink.subsidy.enums.Status;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemeCatalogDto {

	private Integer schemeId;
	private String schemeName;
	private String category;
	private String eligibilityCriteria;
	private Double benefitAmount;
	private String fundingSource;
	private LocalDate startDate;
	private LocalDate endDate;
	private Status status;
}

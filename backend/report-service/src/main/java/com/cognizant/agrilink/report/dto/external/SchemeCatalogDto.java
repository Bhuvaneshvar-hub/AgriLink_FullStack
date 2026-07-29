package com.cognizant.agrilink.report.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SchemeCatalogDto {
	private Integer schemeId;
	private String schemeName;
	private String category;
	private String eligibilityCriteria;
	private Double benefitAmount;
	private String fundingSource;
	private LocalDate startDate;
	private LocalDate endDate;
	private String status;
}

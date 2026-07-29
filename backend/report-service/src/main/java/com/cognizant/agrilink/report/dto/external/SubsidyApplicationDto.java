package com.cognizant.agrilink.report.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class SubsidyApplicationDto {
	private Integer applicationId;
	private Integer farmerId;
	private Integer userId;
	private Integer schemeId;
	private LocalDate applicationDate;
	private Double eligibilityScore;
	private Integer reviewedBy;
	private Double disbursedAmount;
	private LocalDate disbursedDate;
	private String status;
}

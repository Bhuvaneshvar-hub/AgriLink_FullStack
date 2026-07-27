package com.cognizant.agrilink.subsidy.dto;

import com.cognizant.agrilink.subsidy.enums.ApplicationStatus;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
	private ApplicationStatus status;
}

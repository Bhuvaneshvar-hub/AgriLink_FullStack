package com.cognizant.agrilink.report.dto;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgriReportDto {

	private Integer reportId;
	private Integer generatedBy;
	private String scope;
	private String metrics;
	private LocalDate generatedDate;
}

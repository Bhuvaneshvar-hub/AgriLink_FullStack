package com.cognizant.agrilink.report.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class InputRequestDto {
	private Integer requestId;
	private Integer farmerId;
	private Integer inputId;
	private Integer quantityRequested;
	private LocalDate requestDate;
	private Integer assignedCentreId;
	private Double actualPrice;
	private String status;
}

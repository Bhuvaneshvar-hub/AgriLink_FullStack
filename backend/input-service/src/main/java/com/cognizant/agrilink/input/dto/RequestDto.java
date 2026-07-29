package com.cognizant.agrilink.input.dto;

import com.cognizant.agrilink.input.enums.RequestStatus;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RequestDto {

	private Integer requestId;
	private Integer farmerId;
	private Integer inputId;
	private Integer quantityRequested;
	private LocalDate requestDate;
	private Integer assignedCentreId;
	private Double actualPrice;
	private RequestStatus status;
}

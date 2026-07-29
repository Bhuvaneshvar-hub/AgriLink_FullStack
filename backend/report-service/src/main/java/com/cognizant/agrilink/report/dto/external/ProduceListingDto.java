package com.cognizant.agrilink.report.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProduceListingDto {
	private Integer listingId;
	private Integer farmerId;
	private Integer cropId;
	private LocalDate harvestDate;
	private Double quantityKg;
	private String qualityGrade;
	private Double askingPricePerKg;
	private String status;
}

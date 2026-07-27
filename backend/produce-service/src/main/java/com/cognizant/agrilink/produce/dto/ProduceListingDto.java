package com.cognizant.agrilink.produce.dto;

import com.cognizant.agrilink.produce.enums.ListingStatus;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProduceListingDto {

	private Integer listingId;
	private Integer farmerId;
	private Integer cropId;
	private LocalDate harvestDate;
	private Double quantityKg;
	private String qualityGrade;
	private Double askingPricePerKg;
	private ListingStatus status;
}

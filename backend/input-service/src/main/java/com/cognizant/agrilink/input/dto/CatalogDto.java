package com.cognizant.agrilink.input.dto;

import com.cognizant.agrilink.input.enums.Status;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CatalogDto {

	private Integer inputId;
	private String name;
	private String category;
	private String unit;
	private Double pricePerUnit;
	private Double subsidisedPrice;
	private Integer availableStock;
	private Status status;
}

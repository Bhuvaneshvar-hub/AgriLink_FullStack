package com.cognizant.agrilink.report.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class ProduceSaleDto {
	private Integer saleId;
	private Integer listingId;
	private Integer buyerId;
	private Double quantitySoldKg;
	private Double agreedPricePerKg;
	private Double totalAmount;
	private LocalDate saleDate;
	private String paymentStatus;
}

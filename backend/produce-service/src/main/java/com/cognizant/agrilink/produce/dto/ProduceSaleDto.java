package com.cognizant.agrilink.produce.dto;

import com.cognizant.agrilink.produce.enums.PaymentStatus;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProduceSaleDto {

	private Integer saleId;
	private Integer listingId;
	private Integer buyerId;
	private Double quantitySoldKg;
	private Double agreedPricePerKg;
	private Double totalAmount;
	private LocalDate saleDate;
	private PaymentStatus paymentStatus;
	private Boolean farmerPaymentConfirmed;
	private LocalDate farmerConfirmedDate;
}

package com.cognizant.agrilink.produce.entity;

import com.cognizant.agrilink.produce.enums.PaymentStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "produce_sale")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProduceSale {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "saleId")
	private Integer saleId;

	@Column(name = "listingId")
	private Integer listingId;

	@Column(name = "buyerId")
	private Integer buyerId;

	@Column(name = "quantitySoldKg")
	private Double quantitySoldKg;

	@Column(name = "agreedPricePerKg")
	private Double agreedPricePerKg;

	@Column(name = "totalAmount")
	private Double totalAmount;

	@Column(name = "saleDate")
	private LocalDate saleDate;

	@Enumerated(EnumType.STRING)
	@Column(name = "paymentStatus")
	private PaymentStatus paymentStatus;

	/**
	 * Secondary, farmer-side check on a settlement: the buyer marking a sale
	 * {@code PD} (Paid) only claims the money was sent - the selling farmer must
	 * separately confirm they actually received it. {@code null} on legacy rows is
	 * read as "not confirmed".
	 */
	@Column(name = "farmerPaymentConfirmed")
	private Boolean farmerPaymentConfirmed;

	/** Date the selling farmer confirmed receipt; {@code null} until confirmed. */
	@Column(name = "farmerConfirmedDate")
	private LocalDate farmerConfirmedDate;
}

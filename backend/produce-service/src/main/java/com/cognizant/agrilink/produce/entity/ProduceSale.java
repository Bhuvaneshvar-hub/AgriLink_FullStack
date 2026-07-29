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
}

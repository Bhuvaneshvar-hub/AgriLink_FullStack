package com.cognizant.agrilink.produce.entity;

import com.cognizant.agrilink.produce.enums.ListingStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "produce_listing")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ProduceListing {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "listingId")
	private Integer listingId;

	@Column(name = "farmerId")
	private Integer farmerId;

	@Column(name = "cropId")
	private Integer cropId;

	@Column(name = "harvestDate")
	private LocalDate harvestDate;

	@Column(name = "quantityKg")
	private Double quantityKg;

	@Column(name = "qualityGrade")
	private String qualityGrade;

	@Column(name = "askingPricePerKg")
	private Double askingPricePerKg;

	@Enumerated(EnumType.STRING)
	@Column(name = "status")
	private ListingStatus status;

	/**
	 * Kg still open for purchase: {@code quantityKg} minus every quantity already
	 * committed by recorded sales. Derived, never persisted - populated on read by
	 * {@code ProduceSaleService.applyAvailableQuantity} so buyers always see the
	 * remaining stock rather than the originally listed amount.
	 */
	@Transient
	private Double availableQuantityKg;
}

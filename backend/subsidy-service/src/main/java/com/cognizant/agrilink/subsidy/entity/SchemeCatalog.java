package com.cognizant.agrilink.subsidy.entity;

import com.cognizant.agrilink.subsidy.enums.Status;
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
@Table(name = "scheme_catalog")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SchemeCatalog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "schemeId")
	private Integer schemeId;

	@Column(name = "schemeName", unique = true)
	private String schemeName;

	@Column(name = "category")
	private String category;

	@Column(name = "eligibilityCriteria")
	private String eligibilityCriteria;

	@Column(name = "benefitAmount")
	private Double benefitAmount;

	@Column(name = "fundingSource")
	private String fundingSource;

	@Column(name = "startDate")
	private LocalDate startDate;

	@Column(name = "endDate")
	private LocalDate endDate;

	@Enumerated(EnumType.STRING)
	@Column(name = "status")
	private Status status;

	@Column(name = "createdAt")
	private java.time.LocalDateTime createdAt;

	@jakarta.persistence.PrePersist
	protected void onCreate() {
		createdAt = java.time.LocalDateTime.now();
	}
}

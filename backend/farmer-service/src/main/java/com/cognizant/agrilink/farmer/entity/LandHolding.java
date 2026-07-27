package com.cognizant.agrilink.farmer.entity;

import com.cognizant.agrilink.farmer.enums.Status;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "land_holding")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LandHolding {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "holdingId")
	private Integer holdingId;

	@Column(name = "farmerId")
	private Integer farmerId;

	@Column(name = "surveyNumber", unique = true)
	private String surveyNumber;

	@Column(name = "areaAcres")
	private Double areaAcres;

	@Column(name = "soilType")
	private String soilType;

	@Column(name = "irrigationSource")
	private String irrigationSource;

	@Column(name = "ownershipType")
	private String ownershipType;

	@Enumerated(EnumType.STRING)
	@Column(name = "status")
	private Status status;
}

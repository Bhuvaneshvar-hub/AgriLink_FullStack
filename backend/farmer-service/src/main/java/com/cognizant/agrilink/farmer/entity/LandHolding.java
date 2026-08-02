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
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
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

	// Stored as VARCHAR (not a native MySQL ENUM) so new Status values can be added
	// without an ALTER — a native enum column would reject values added after creation.
	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.VARCHAR)
	@Column(name = "status")
	private Status status;
}

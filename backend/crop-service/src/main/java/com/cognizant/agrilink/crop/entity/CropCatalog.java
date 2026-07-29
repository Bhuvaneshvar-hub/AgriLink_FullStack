package com.cognizant.agrilink.crop.entity;

import com.cognizant.agrilink.crop.enums.Status;
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
@Table(name = "crop_catalog")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropCatalog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "cropId")
	private Integer cropId;

	@Column(name = "cropName", unique = true)
	private String cropName;

	@Column(name = "category")
	private String category;

	@Column(name = "season")
	private String season;

	@Column(name = "typicalDurationDays")
	private Integer typicalDurationDays;

	@Column(name = "expectedYieldPerAcre")
	private Double expectedYieldPerAcre;

	@Column(name = "description", length = 500)
	private String description;

	@Enumerated(EnumType.STRING)
	@Column(name = "status")
	private Status status;
}

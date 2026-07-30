package com.cognizant.agrilink.crop.entity;

import com.cognizant.agrilink.crop.enums.PlanStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "crop_plan", uniqueConstraints = @UniqueConstraint(
		columnNames = {"farmerId", "holdingId", "cropId", "season", "year"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropPlan {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "planId")
	private Integer planId;

	@Column(name = "farmerId")
	private Integer farmerId;

	@Column(name = "holdingId")
	private Integer holdingId;

	@Column(name = "cropId")
	private Integer cropId;

	@Column(name = "season")
	private String season;

	@Column(name = "year")
	private Integer year;

	@Column(name = "sowingDate")
	private LocalDate sowingDate;

	@Column(name = "expectedHarvestDate")
	private LocalDate expectedHarvestDate;

	@Column(name = "areaPlanted")
	private Double areaPlanted;

	@Enumerated(EnumType.STRING)
	@Column(name = "status")
	private PlanStatus status;
}

package com.cognizant.agrilink.crop.entity;

import com.cognizant.agrilink.crop.enums.Stage;
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
@Table(name = "growth_observation")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GrowthObservation {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "observationId")
	private Integer observationId;

	@Column(name = "planId")
	private Integer planId;

	@Column(name = "officerId")
	private Integer officerId;

	@Column(name = "observationDate")
	private LocalDate observationDate;

	@Enumerated(EnumType.STRING)
	@Column(name = "stage")
	private Stage stage;

	@Column(name = "pestOrDiseaseFlag")
	private Boolean pestOrDiseaseFlag;

	@Column(name = "remarks")
	private String remarks;
}

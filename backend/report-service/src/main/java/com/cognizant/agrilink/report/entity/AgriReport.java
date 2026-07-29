package com.cognizant.agrilink.report.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
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
@Table(name = "agri_report")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AgriReport {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "reportId")
	private Integer reportId;

	@Column(name = "generatedBy")
	private Integer generatedBy;

	@Column(name = "scope")
	private String scope;

	@Column(name = "metrics")
	private String metrics;

	@Column(name = "generatedDate")
	private LocalDate generatedDate;
}

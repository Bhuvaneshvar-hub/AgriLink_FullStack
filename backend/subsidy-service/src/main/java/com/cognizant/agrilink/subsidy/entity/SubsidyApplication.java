package com.cognizant.agrilink.subsidy.entity;

import com.cognizant.agrilink.subsidy.enums.ApplicationStatus;
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
@Table(name = "subsidy_application",
		uniqueConstraints = @UniqueConstraint(columnNames = {"farmerId", "schemeId"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SubsidyApplication {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "applicationId")
	private Integer applicationId;

	@Column(name = "farmerId")
	private Integer farmerId;

	// Owning IAM user (JWT subject) — used for object-level ownership checks.
	@Column(name = "userId")
	private Integer userId;

	@Column(name = "schemeId")
	private Integer schemeId;

	@Column(name = "applicationDate")
	private LocalDate applicationDate;

	@Column(name = "eligibilityScore")
	private Double eligibilityScore;

	@Column(name = "reviewedBy")
	private Integer reviewedBy;

	@Column(name = "disbursedAmount")
	private Double disbursedAmount;

	@Column(name = "disbursedDate")
	private LocalDate disbursedDate;

	@Enumerated(EnumType.STRING)
	@Column(name = "status")
	private ApplicationStatus status;

	@Column(name = "createdAt")
	private java.time.LocalDateTime createdAt;

	@jakarta.persistence.PrePersist
	protected void onCreate() {
		createdAt = java.time.LocalDateTime.now();
	}
}

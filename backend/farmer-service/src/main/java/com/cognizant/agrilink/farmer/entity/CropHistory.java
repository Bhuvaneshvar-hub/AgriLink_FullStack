package com.cognizant.agrilink.farmer.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Historical record of a crop previously grown on a land holding.
 *
 * <p>Backs the "Maintain crop history" feature of the Farmer &amp; Land
 * Registration module (design section 4.2). Unlike a {@code CropPlan} (which
 * lives in the crop-service and drives the current season), this is a
 * denormalized, read-mostly log of past cropping seasons kept alongside the
 * land holding it belongs to. The crop name is stored as free text so the
 * record survives independently of the crop catalog.</p>
 */
@Entity
@Table(name = "crop_history")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CropHistory {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "historyId")
	private Integer historyId;

	@Column(name = "holdingId")
	private Integer holdingId;

	@Column(name = "farmerId")
	private Integer farmerId;

	@Column(name = "cropName")
	private String cropName;

	/** Kharif / Rabi / Zaid / Perennial. Kept as free text to avoid cross-service enum coupling. */
	@Column(name = "season")
	private String season;

	@Column(name = "cropYear")
	private Integer cropYear;

	@Column(name = "areaAcres")
	private Double areaAcres;

	/** Actual harvested yield, in quintals. */
	@Column(name = "yieldQuintals")
	private Double yieldQuintals;

	@Column(name = "remarks")
	private String remarks;
}

package com.cognizant.agrilink.input.entity;

import com.cognizant.agrilink.input.enums.Status;
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
@Table(name = "catalog")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Catalog {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "inputId")
	private Integer inputId;

	@Column(name = "name", unique = true)
	private String name;

	@Column(name = "category")
	private String category;

	@Column(name = "unit")
	private String unit;

	@Column(name = "pricePerUnit")
	private Double pricePerUnit;

	@Column(name = "subsidisedPrice")
	private Double subsidisedPrice;

	@Column(name = "availableStock")
	private Integer availableStock;

	@Enumerated(EnumType.STRING)
	@Column(name = "status")
	private Status status;
}

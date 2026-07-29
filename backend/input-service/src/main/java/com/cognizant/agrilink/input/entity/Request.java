package com.cognizant.agrilink.input.entity;

import com.cognizant.agrilink.input.enums.RequestStatus;
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
@Table(name = "request")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Request {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "requestId")
	private Integer requestId;

	@Column(name = "farmerId")
	private Integer farmerId;

	@Column(name = "inputId")
	private Integer inputId;

	@Column(name = "quantityRequested")
	private Integer quantityRequested;

	@Column(name = "requestDate")
	private LocalDate requestDate;

	@Column(name = "assignedCentreId")
	private Integer assignedCentreId;

	@Column(name = "actualPrice")
	private Double actualPrice;

	@Enumerated(EnumType.STRING)
	@Column(name = "status")
	private RequestStatus status;
}

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
import java.time.LocalDate;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "farmer_profile")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmerProfile {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	@Column(name = "farmerId")
	private Integer farmerId;

	@Column(name = "userId")
	private Integer userId;

	@Column(name = "name")
	private String name;

	@Column(name = "dateOfBirth")
	private LocalDate dateOfBirth;

	@Column(name = "gender")
	private String gender;

	@Column(name = "nationalIdNumber", unique = true)
	private String nationalIdNumber;

	@Column(name = "village")
	private String village;

	@Column(name = "district")
	private String district;

	@Column(name = "state")
	private String state;

	@Column(name = "phone")
	private String phone;

	@Column(name = "bankAccountNumber")
	private String bankAccountNumber;

	// Stored as VARCHAR (not a native MySQL ENUM) so new Status values can be added
	// without an ALTER — a native enum column would reject values added after creation.
	@Enumerated(EnumType.STRING)
	@JdbcTypeCode(SqlTypes.VARCHAR)
	@Column(name = "status")
	private Status status;
}

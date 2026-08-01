package com.cognizant.agrilink.farmer.dto;

import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Public farmer self-registration payload. Carries both the login-account fields
 * (used to create the IAM user) and the farmer profile fields. The created login
 * account starts Pending (approval required) and the profile starts Inactive.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SelfRegisterFarmerDto {

	// Login-account fields (forwarded to iam-service)
	private String name;
	private String email;
	private String password;
	private String phone;
	private Integer regionId;

	// Farmer profile fields
	private LocalDate dateOfBirth;
	private String gender;
	private String nationalIdNumber;
	private String village;
	private String district;
	private String state;
	private String bankAccountNumber;
}

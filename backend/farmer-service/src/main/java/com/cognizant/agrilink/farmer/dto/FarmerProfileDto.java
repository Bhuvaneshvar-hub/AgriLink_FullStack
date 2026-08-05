package com.cognizant.agrilink.farmer.dto;

import com.cognizant.agrilink.farmer.enums.Status;
import java.time.LocalDate;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FarmerProfileDto {

	private Integer farmerId;
	private Integer userId;
	private Integer regionId;
	private String name;
	private LocalDate dateOfBirth;
	private String gender;
	private String nationalIdNumber;
	private String village;
	private String district;
	private String state;
	private String phone;
	private String bankAccountNumber;
	private Status status;
}

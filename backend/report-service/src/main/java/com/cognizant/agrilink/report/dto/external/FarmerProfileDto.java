package com.cognizant.agrilink.report.dto.external;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;

@Data
@JsonIgnoreProperties(ignoreUnknown = true)
public class FarmerProfileDto {
	private Integer farmerId;
	private Integer userId;
	private String name;
	private String village;
	private String district;
	private String state;
	private String phone;
	private String status;
}

package com.cognizant.agrilink.iam.identityAccess.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CreateRoleRequestDto {

    @NotBlank(message = "roleName is required")
    @Size(max = 100, message = "roleName must not exceed 100 characters")
    private String roleName;

    @Size(max = 255, message = "description must not exceed 255 characters")
    private String description;
}

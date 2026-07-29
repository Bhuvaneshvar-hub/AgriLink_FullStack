package com.cognizant.agrilink.iam.identityAccess.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Partial update — only non-null fields are applied.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateRoleRequestDto {

    @Size(max = 100, message = "roleName must not exceed 100 characters")
    private String roleName;

    @Size(max = 255, message = "description must not exceed 255 characters")
    private String description;

    @Pattern(regexp = "A|I", message = "status must be 'A' (Active) or 'I' (Inactive)")
    private String status;
}

package com.cognizant.agrilink.iam.identityAccess.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Partial update — only non-null fields are applied.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateUserRequestDto {

    @Size(max = 150, message = "name must not exceed 150 characters")
    private String name;

    // Optional on update, but when provided must be exactly 10 digits
    @Pattern(regexp = "\\d{10}", message = "phone must be exactly 10 digits")
    private String phone;

    private Integer regionId;

    private Integer roleId;

    @Pattern(regexp = "A|I|S|P",
            message = "status must be 'A' (Active), 'I' (Inactive), 'S' (Suspended) or 'P' (Pending)")
    private String status;
}

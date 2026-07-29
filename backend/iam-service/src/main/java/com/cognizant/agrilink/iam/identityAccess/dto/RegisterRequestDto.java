package com.cognizant.agrilink.iam.identityAccess.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Farmer self-registration. The created account starts in Pending (P) status
 * and must be approved by an AgriLinkAdmin or ExtensionOfficer before login.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class RegisterRequestDto {

    @NotBlank(message = "Name is required")
    private String name;

    @NotBlank(message = "Email is required")
    @Email(message = "Enter a valid email address")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters")
    private String password;

    @NotBlank(message = "phone is required")
    @Pattern(regexp = "\\d{10}", message = "phone must be exactly 10 digits")
    private String phone;

    private Integer regionId;

    /**
     * Requested role name (enum): Farmer | ExtensionOfficer | ProcurementOfficer.
     * Defaults to Farmer when omitted. Any account self-registered this way starts
     * Pending and must be approved before it can log in.
     */
    private String role;
}

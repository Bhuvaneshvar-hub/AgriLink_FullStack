package com.cognizant.agrilink.iam.identityAccess.dto;

import jakarta.validation.constraints.*;
import lombok.*;

/**
 * Admin-initiated password reset for a user who is locked out / forgot their password.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ResetPasswordRequestDto {

    @NotBlank(message = "newPassword is required")
    @Size(min = 8, message = "newPassword must be at least 8 characters")
    private String newPassword;
}

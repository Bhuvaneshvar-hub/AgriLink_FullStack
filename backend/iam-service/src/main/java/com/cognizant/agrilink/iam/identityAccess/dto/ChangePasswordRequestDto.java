package com.cognizant.agrilink.iam.identityAccess.dto;

import jakarta.validation.constraints.*;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChangePasswordRequestDto {

    @NotBlank(message = "currentPassword is required")
    private String currentPassword;

    @NotBlank(message = "newPassword is required")
    @Size(min = 8, message = "newPassword must be at least 8 characters")
    private String newPassword;
}

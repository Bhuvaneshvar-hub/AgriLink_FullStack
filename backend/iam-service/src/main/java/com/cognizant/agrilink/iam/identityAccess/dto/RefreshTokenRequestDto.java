package com.cognizant.agrilink.iam.identityAccess.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class RefreshTokenRequestDto {

    @NotBlank(message = "refreshToken is required")
    private String refreshToken;
}

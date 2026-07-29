package com.cognizant.agrilink.iam.identityAccess.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoginResponseDto {
    private String accessToken;
    private String refreshToken;
    private long expiresIn;       // access token TTL in seconds (900)
    private Integer userId;
    private String roleName;
    private Integer regionId;
}

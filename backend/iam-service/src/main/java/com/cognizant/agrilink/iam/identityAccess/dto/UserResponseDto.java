package com.cognizant.agrilink.iam.identityAccess.dto;

import lombok.*;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponseDto {
    private Integer userId;
    private String name;
    private String email;
    private String phone;
    private String roleName;
    private Integer regionId;
    private String status;
    private LocalDateTime createdAt;
}

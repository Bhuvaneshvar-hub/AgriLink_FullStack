package com.cognizant.agrilink.iam.identityAccess.dto;

import lombok.*;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleResponseDto {
    private Integer roleId;
    private String roleName;
    private String description;
    private String status;
}

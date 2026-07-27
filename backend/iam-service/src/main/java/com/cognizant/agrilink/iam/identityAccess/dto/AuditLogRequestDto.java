package com.cognizant.agrilink.iam.identityAccess.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Payload other microservices POST to /agriLink/audit to record an action.
 * The timestamp is assigned server-side by the AuditLog entity's @PrePersist.
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogRequestDto {
    private Integer userId;
    private String action;
    private String module;
    private String ipAddress;
}

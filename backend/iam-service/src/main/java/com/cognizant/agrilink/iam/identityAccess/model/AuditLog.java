package com.cognizant.agrilink.iam.identityAccess.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_log")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer auditId;

    private Integer userId;

    @Column(length = 100)
    private String action;

    @Column(length = 100)
    private String module;

    private LocalDateTime timestamp;

    @Column(length = 45)
    private String ipAddress;

    @PrePersist
    protected void onCreate() {
        if (this.timestamp == null) {
            this.timestamp = LocalDateTime.now();
        }
    }
}

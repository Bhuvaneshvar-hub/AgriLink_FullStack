package com.cognizant.agrilink.iam.identityAccess.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "user_session")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer sessionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "userId", nullable = false)
    private UserDetails user;

    // Only refresh token is stored — JWT (access token) is self-verifying
    @Column(nullable = false, unique = true, length = 64)
    private String refreshTokenHash;

    @Column(nullable = false)
    private LocalDateTime refreshTokenExpiresAt;

    private LocalDateTime refreshTokenRotatedAt;

    @Column(length = 45)
    private String ipAddress;

    @Column(length = 255)
    private String deviceInfo;

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Status status = Status.Active;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    public enum Status { Active, Expired, Revoked }
}

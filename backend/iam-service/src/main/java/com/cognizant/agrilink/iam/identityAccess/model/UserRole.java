package com.cognizant.agrilink.iam.identityAccess.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "user_role")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserRole {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer roleId;

    @Column(nullable = false, unique = true, length = 100)
    private String roleName;

    @Column(length = 255)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private Status status = Status.A;

    // A = Active, I = Inactive
    public enum Status { A, I }
}

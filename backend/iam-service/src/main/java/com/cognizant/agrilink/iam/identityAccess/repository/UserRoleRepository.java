package com.cognizant.agrilink.iam.identityAccess.repository;

import com.cognizant.agrilink.iam.identityAccess.model.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface UserRoleRepository extends JpaRepository<UserRole, Integer> {
    Optional<UserRole> findByRoleName(String roleName);

    // Case-insensitive lookup used to guarantee role-name uniqueness on create/update.
    Optional<UserRole> findByRoleNameIgnoreCase(String roleName);
}

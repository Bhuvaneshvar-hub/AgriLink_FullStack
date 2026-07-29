package com.cognizant.agrilink.iam.identityAccess.repository;

import com.cognizant.agrilink.iam.identityAccess.model.UserDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface UserDetailsRepository extends JpaRepository<UserDetails, Integer> {
    Optional<UserDetails> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByRole_RoleId(Integer roleId);
    List<UserDetails> findByStatus(UserDetails.Status status);
}

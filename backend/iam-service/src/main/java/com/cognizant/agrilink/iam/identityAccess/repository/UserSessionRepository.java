package com.cognizant.agrilink.iam.identityAccess.repository;

import com.cognizant.agrilink.iam.identityAccess.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface UserSessionRepository extends JpaRepository<UserSession, Integer> {

    Optional<UserSession> findByRefreshTokenHash(String refreshTokenHash);

    @Modifying
    @Query("UPDATE UserSession s SET s.status = 'Revoked' WHERE s.user.userId = :userId AND s.status = 'Active'")
    void revokeAllActiveSessionsByUserId(@Param("userId") Integer userId);
}

package com.cognizant.agrilink.iam.identityAccess.repository;

import com.cognizant.agrilink.iam.identityAccess.model.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Integer> {
    List<AuditLog> findByUserId(Integer userId);
}

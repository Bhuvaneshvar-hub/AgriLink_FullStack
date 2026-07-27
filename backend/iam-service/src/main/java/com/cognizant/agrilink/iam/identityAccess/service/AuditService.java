package com.cognizant.agrilink.iam.identityAccess.service;

import com.cognizant.agrilink.iam.exception.ResourceNotFoundException;
import com.cognizant.agrilink.iam.identityAccess.dto.AuditLogRequestDto;
import com.cognizant.agrilink.iam.identityAccess.model.AuditLog;
import com.cognizant.agrilink.iam.identityAccess.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Central audit store for the whole platform. Every module reports its
 * write actions here via POST /agriLink/audit.
 */
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    // ── Create (called by other services for inter-service audit logging) ──────
    public AuditLog record(AuditLogRequestDto dto) {
        AuditLog log = AuditLog.builder()
                .userId(dto.getUserId())
                .action(dto.getAction())
                .module(dto.getModule())
                .ipAddress(dto.getIpAddress())
                .build(); // timestamp set by @PrePersist
        return auditLogRepository.save(log);
    }

    // ── Read ───────────────────────────────────────────────────────────────────
    public List<AuditLog> getAll() {
        return auditLogRepository.findAll();
    }

    public AuditLog getById(Integer id) {
        return auditLogRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Audit log not found with id: " + id));
    }

    public List<AuditLog> getByUser(Integer userId) {
        return auditLogRepository.findByUserId(userId);
    }
}

package com.cognizant.agrilink.iam.identityAccess.controller;

import com.cognizant.agrilink.iam.identityAccess.dto.AuditLogRequestDto;
import com.cognizant.agrilink.iam.identityAccess.model.AuditLog;
import com.cognizant.agrilink.iam.identityAccess.service.AuditService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Centralized audit API for the whole platform.
 *   POST /agriLink/audit            — record an action (called by other services)
 *   GET  /agriLink/audit            — list all audit logs
 *   GET  /agriLink/audit/{id}       — get one audit log by id
 *   GET  /agriLink/audit/user/{id}  — get all audit logs for a user
 *
 * Reads are restricted to AgriLinkAdmin / ComplianceAnalyst (see SecurityConfig).
 * The POST is open to any authenticated principal so any module can report an
 * action performed by the currently logged-in user (JWT is forwarded).
 */
@RestController
@RequestMapping("/agriLink/audit")
@RequiredArgsConstructor
public class AuditController {

    private final AuditService auditService;

    @PostMapping
    public ResponseEntity<AuditLog> create(@RequestBody AuditLogRequestDto dto) {
        return ResponseEntity.status(HttpStatus.CREATED).body(auditService.record(dto));
    }

    @GetMapping
    public ResponseEntity<List<AuditLog>> getAllAuditLogs() {
        return ResponseEntity.ok(auditService.getAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AuditLog> getAuditLogById(@PathVariable Integer id) {
        return ResponseEntity.ok(auditService.getById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<List<AuditLog>> getAuditLogsByUser(@PathVariable Integer userId) {
        return ResponseEntity.ok(auditService.getByUser(userId));
    }
}

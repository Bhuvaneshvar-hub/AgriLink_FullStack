package com.cognizant.agrilink.iam.identityAccess.repository;

import com.cognizant.agrilink.iam.identityAccess.model.AuditLog;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

// Runs against the H2 test database; @Transactional rolls back each test.
@SpringBootTest
@Transactional
class AuditLogRepositoryTest {

    @Autowired private AuditLogRepository repository;

    @Test
    void save_persistsWithGeneratedIdAndTimestamp() {
        AuditLog saved = repository.save(AuditLog.builder()
                .userId(1).action("LOGIN").module("IAM").ipAddress("127.0.0.1")
                .build());

        assertNotNull(saved.getAuditId());
        // @PrePersist sets the timestamp when null
        assertNotNull(saved.getTimestamp());
        assertEquals("LOGIN", saved.getAction());
    }

    @Test
    void findAll_returnsSavedEntries() {
        repository.save(AuditLog.builder().userId(1).action("CREATE_USER").module("IAM").build());
        repository.save(AuditLog.builder().userId(2).action("APPROVE_USER").module("IAM").build());

        assertTrue(repository.findAll().size() >= 2);
    }
}

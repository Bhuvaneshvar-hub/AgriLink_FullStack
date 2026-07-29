package com.cognizant.agrilink.iam.identityAccess.repository;

import com.cognizant.agrilink.iam.identityAccess.model.UserRole;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

// Runs against the H2 test database; @Transactional rolls back each test.
// Names are prefixed to avoid clashing with seeded roles.
@SpringBootTest
@Transactional
class UserRoleRepositoryTest {

    @Autowired private UserRoleRepository repository;
    @PersistenceContext private EntityManager em;

    private UserRole persistRole(String name) {
        UserRole r = UserRole.builder().roleName(name).description("d").status(UserRole.Status.A).build();
        em.persist(r);
        em.flush();
        return r;
    }

    @Test
    void findByRoleName_found() {
        persistRole("ZZTEST_RoleFound");

        Optional<UserRole> result = repository.findByRoleName("ZZTEST_RoleFound");

        assertTrue(result.isPresent());
        assertEquals("ZZTEST_RoleFound", result.get().getRoleName());
    }

    @Test
    void findByRoleName_notFound() {
        assertTrue(repository.findByRoleName("ZZTEST_DoesNotExist").isEmpty());
    }

    @Test
    void save_persistsWithGeneratedId() {
        UserRole saved = repository.save(UserRole.builder()
                .roleName("ZZTEST_RoleSave").status(UserRole.Status.A).build());
        em.flush();
        assertNotNull(saved.getRoleId());
    }
}

package com.cognizant.agrilink.iam.identityAccess.repository;

import com.cognizant.agrilink.iam.identityAccess.model.UserDetails;
import com.cognizant.agrilink.iam.identityAccess.model.UserRole;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.*;

// Runs against the H2 test database; @Transactional rolls back each test.
@SpringBootTest
@Transactional
class UserDetailsRepositoryTest {

    @Autowired private UserDetailsRepository repository;
    @PersistenceContext private EntityManager em;

    private UserRole persistRole(String name) {
        UserRole r = UserRole.builder().roleName(name).description("d").status(UserRole.Status.A).build();
        em.persist(r);
        return r;
    }

    private UserDetails persistUser(String email, UserRole role) {
        UserDetails u = UserDetails.builder()
                .role(role).name("User").email(email).phone("9876543210")
                .passwordHash("hash").regionId(1).status(UserDetails.Status.A).build();
        em.persist(u);
        em.flush();
        return u;
    }

    @Test
    void findByEmail_found() {
        UserRole role = persistRole("ZZTEST_RoleA");
        persistUser("zztest_admin@a.com", role);

        var result = repository.findByEmail("zztest_admin@a.com");

        assertTrue(result.isPresent());
        assertEquals("zztest_admin@a.com", result.get().getEmail());
        assertEquals("ZZTEST_RoleA", result.get().getRole().getRoleName());
    }

    @Test
    void findByEmail_notFound() {
        assertTrue(repository.findByEmail("zztest_nobody@a.com").isEmpty());
    }

    @Test
    void existsByEmail_trueWhenPresent() {
        UserRole role = persistRole("ZZTEST_RoleB");
        persistUser("zztest_f@a.com", role);

        assertTrue(repository.existsByEmail("zztest_f@a.com"));
    }

    @Test
    void existsByEmail_falseWhenAbsent() {
        assertFalse(repository.existsByEmail("zztest_ghost@a.com"));
    }

    @Test
    void existsByRoleRoleId_trueWhenUserAssigned() {
        UserRole role = persistRole("ZZTEST_RoleC");
        persistUser("zztest_assigned@a.com", role);

        assertTrue(repository.existsByRole_RoleId(role.getRoleId()));
    }

    @Test
    void existsByRoleRoleId_falseWhenNoUserAssigned() {
        UserRole role = persistRole("ZZTEST_EmptyRole");
        em.flush();

        assertFalse(repository.existsByRole_RoleId(role.getRoleId()));
    }
}

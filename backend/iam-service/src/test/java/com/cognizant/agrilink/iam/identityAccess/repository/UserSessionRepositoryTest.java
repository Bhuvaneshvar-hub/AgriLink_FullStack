package com.cognizant.agrilink.iam.identityAccess.repository;

import com.cognizant.agrilink.iam.identityAccess.model.UserDetails;
import com.cognizant.agrilink.iam.identityAccess.model.UserRole;
import com.cognizant.agrilink.iam.identityAccess.model.UserSession;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;

// Runs against the H2 test database; @Transactional rolls back each test.
@SpringBootTest
@Transactional
class UserSessionRepositoryTest {

    @Autowired private UserSessionRepository repository;
    @PersistenceContext private EntityManager em;

    private UserDetails persistUser(String email) {
        UserRole role = UserRole.builder().roleName("ZZTEST_Role-" + email).status(UserRole.Status.A).build();
        em.persist(role);
        UserDetails u = UserDetails.builder()
                .role(role).name("User").email(email).phone("9876543210")
                .passwordHash("hash").regionId(1).status(UserDetails.Status.A).build();
        em.persist(u);
        return u;
    }

    private UserSession persistSession(UserDetails user, String hash, UserSession.Status status) {
        UserSession s = UserSession.builder()
                .user(user).refreshTokenHash(hash)
                .refreshTokenExpiresAt(LocalDateTime.now().plusDays(7))
                .status(status).build();
        em.persist(s);
        return s;
    }

    @Test
    void findByRefreshTokenHash_found() {
        UserDetails u = persistUser("zztest_sess1@a.com");
        persistSession(u, "zztest-hash-abc", UserSession.Status.Active);
        em.flush();

        var result = repository.findByRefreshTokenHash("zztest-hash-abc");

        assertTrue(result.isPresent());
        assertEquals("zztest_sess1@a.com", result.get().getUser().getEmail());
    }

    @Test
    void findByRefreshTokenHash_notFound() {
        assertTrue(repository.findByRefreshTokenHash("zztest-no-such-hash").isEmpty());
    }

    @Test
    void revokeAllActiveSessionsByUserId_revokesOnlyActiveForThatUser() {
        UserDetails u1 = persistUser("zztest_u1@a.com");
        UserDetails u2 = persistUser("zztest_u2@a.com");

        UserSession a1 = persistSession(u1, "zz-u1-active-1", UserSession.Status.Active);
        UserSession a2 = persistSession(u1, "zz-u1-active-2", UserSession.Status.Active);
        UserSession expired = persistSession(u1, "zz-u1-expired", UserSession.Status.Expired);
        UserSession other = persistSession(u2, "zz-u2-active", UserSession.Status.Active);
        em.flush();

        repository.revokeAllActiveSessionsByUserId(u1.getUserId());
        em.clear();   // drop the 1st-level cache so we read the rows the bulk update changed

        assertEquals(UserSession.Status.Revoked, repository.findById(a1.getSessionId()).orElseThrow().getStatus());
        assertEquals(UserSession.Status.Revoked, repository.findById(a2.getSessionId()).orElseThrow().getStatus());
        // an already-expired session is untouched (query only targets Active)
        assertEquals(UserSession.Status.Expired, repository.findById(expired.getSessionId()).orElseThrow().getStatus());
        // another user's active session is untouched
        assertEquals(UserSession.Status.Active, repository.findById(other.getSessionId()).orElseThrow().getStatus());
    }
}

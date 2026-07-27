package com.cognizant.agrilink.iam.security;

import com.cognizant.agrilink.iam.identityAccess.model.UserDetails;
import com.cognizant.agrilink.iam.identityAccess.model.UserRole;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;

    @BeforeEach
    void setUp() {
        jwtUtil = new JwtUtil();
        // HS256 requires a key of at least 256 bits (32 bytes)
        ReflectionTestUtils.setField(jwtUtil, "secret",
                "agrilink_test_secret_key_2026_must_be_long_enough_256");
        ReflectionTestUtils.setField(jwtUtil, "accessTokenExpiryMs", 900_000L);
    }

    private UserDetails user() {
        UserRole role = UserRole.builder().roleId(3).roleName("Farmer").status(UserRole.Status.A).build();
        return UserDetails.builder()
                .userId(7).email("u@a.com").regionId(9).role(role)
                .status(UserDetails.Status.A).build();
    }

    @Test
    void generateAccessToken_producesNonEmptyToken() {
        String token = jwtUtil.generateAccessToken(user());
        assertNotNull(token);
        assertFalse(token.isBlank());
        assertEquals(3, token.split("\\.").length, "JWT should have 3 parts");
    }

    @Test
    void extractUserId() {
        String token = jwtUtil.generateAccessToken(user());
        assertEquals(7, jwtUtil.extractUserId(token));
    }

    @Test
    void extractRoleId() {
        String token = jwtUtil.generateAccessToken(user());
        assertEquals(3, jwtUtil.extractRoleId(token));
    }

    @Test
    void extractRoleName() {
        String token = jwtUtil.generateAccessToken(user());
        assertEquals("Farmer", jwtUtil.extractRoleName(token));
    }

    @Test
    void extractRegionId() {
        String token = jwtUtil.generateAccessToken(user());
        assertEquals(9, jwtUtil.extractRegionId(token));
    }

    @Test
    void isTokenValid_trueForFreshToken() {
        String token = jwtUtil.generateAccessToken(user());
        assertTrue(jwtUtil.isTokenValid(token));
    }

    @Test
    void isTokenValid_falseForGarbage() {
        assertFalse(jwtUtil.isTokenValid("not-a-jwt"));
    }

    @Test
    void isTokenValid_falseForTamperedToken() {
        String token = jwtUtil.generateAccessToken(user());
        assertFalse(jwtUtil.isTokenValid(token + "tampered"));
    }

    @Test
    void isTokenValid_falseForTokenSignedWithDifferentKey() {
        String token = jwtUtil.generateAccessToken(user());
        JwtUtil other = new JwtUtil();
        ReflectionTestUtils.setField(other, "secret",
                "a_completely_different_secret_key_value_2026_long_ok");
        ReflectionTestUtils.setField(other, "accessTokenExpiryMs", 900_000L);
        assertFalse(other.isTokenValid(token));
    }

    @Test
    void extractAllClaims_throwsOnInvalidToken() {
        assertThrows(RuntimeException.class, () -> jwtUtil.extractAllClaims("garbage.token.value"));
    }

    @Test
    void expiredToken_isInvalid() {
        // negative TTL -> token already expired at creation
        ReflectionTestUtils.setField(jwtUtil, "accessTokenExpiryMs", -1_000L);
        String token = jwtUtil.generateAccessToken(user());
        assertFalse(jwtUtil.isTokenValid(token));
    }
}

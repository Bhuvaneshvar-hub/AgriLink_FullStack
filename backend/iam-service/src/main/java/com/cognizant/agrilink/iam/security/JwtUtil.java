package com.cognizant.agrilink.iam.security;

import com.cognizant.agrilink.iam.identityAccess.model.UserDetails;
import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.access-token-expiry-ms}")
    private long accessTokenExpiryMs;

    private SecretKey getSigningKey() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    // ── Generate access token ─────────────────────────────────────────────────
    public String generateAccessToken(UserDetails user) {
        return Jwts.builder()
                .subject(String.valueOf(user.getUserId()))          // sub = userId
                .claim("roleId",   user.getRole().getRoleId())      // for RBAC checks
                .claim("roleName", user.getRole().getRoleName())    // other microservices read this for RBAC
                .claim("regionId", user.getRegionId())              // for data scoping
                .issuedAt(new Date())
                .expiration(new Date(System.currentTimeMillis() + accessTokenExpiryMs))
                .signWith(getSigningKey())
                .compact();
    }

    // ── Extract claims ────────────────────────────────────────────────────────
    public Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public Integer extractUserId(String token) {
        return Integer.parseInt(extractAllClaims(token).getSubject());
    }

    public Integer extractRoleId(String token) {
        return extractAllClaims(token).get("roleId", Integer.class);
    }

    public String extractRoleName(String token) {
        return extractAllClaims(token).get("roleName", String.class);
    }

    public Integer extractRegionId(String token) {
        return extractAllClaims(token).get("regionId", Integer.class);
    }

    // ── Validate token ────────────────────────────────────────────────────────
    public boolean isTokenValid(String token) {
        try {
            extractAllClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}

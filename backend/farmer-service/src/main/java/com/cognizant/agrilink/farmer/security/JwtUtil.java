package com.cognizant.agrilink.farmer.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;

@Component
public class JwtUtil {

    @Value("${jwt.secret}")
    private String secret;

    private SecretKey key() {
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public Claims extractAllClaims(String t) {
        return Jwts.parser().verifyWith(key()).build().parseSignedClaims(t).getPayload();
    }

    public boolean isValid(String t) {
        try {
            extractAllClaims(t);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }

    public String extractRoleName(String t) {
        return extractAllClaims(t).get("roleName", String.class);
    }

    public Integer extractUserId(String t) {
        return Integer.parseInt(extractAllClaims(t).getSubject());
    }
}

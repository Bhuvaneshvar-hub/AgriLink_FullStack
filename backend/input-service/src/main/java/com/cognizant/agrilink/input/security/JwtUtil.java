package com.cognizant.agrilink.input.security;

import static java.nio.charset.StandardCharsets.UTF_8;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import javax.crypto.SecretKey;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class JwtUtil {

	private final SecretKey key;

	public JwtUtil(@Value("${jwt.secret}") String secret) {
		this.key = Keys.hmacShaKeyFor(secret.getBytes(UTF_8));
	}

	public Claims extractAllClaims(String token) {
		return Jwts.parser()
				.verifyWith(key)
				.build()
				.parseSignedClaims(token)
				.getPayload();
	}

	public boolean isValid(String token) {
		try {
			extractAllClaims(token);
			return true;
		} catch (JwtException | IllegalArgumentException e) {
			return false;
		}
	}

	public String extractRoleName(String token) {
		return extractAllClaims(token).get("roleName", String.class);
	}

	public Integer extractUserId(String token) {
		return Integer.parseInt(extractAllClaims(token).getSubject());
	}
}

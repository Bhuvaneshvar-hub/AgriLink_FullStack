package com.cognizant.agrilink.iam.security;

import com.cognizant.agrilink.iam.identityAccess.repository.UserDetailsRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsRepository userDetailsRepository;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        final String authHeader = request.getHeader("Authorization");

        // Skip if no Bearer token present
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        final String token = authHeader.substring(7);

        // Validate JWT signature and expiry
        if (!jwtUtil.isTokenValid(token)) {
            filterChain.doFilter(request, response);
            return;
        }

        Integer userId = jwtUtil.extractUserId(token);

        // Only set auth if not already authenticated
        if (userId != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            var userOpt = userDetailsRepository.findById(userId);
            if (userOpt.isPresent() && userOpt.get().getStatus() == com.cognizant.agrilink.iam.identityAccess.model.UserDetails.Status.A) {
                var auth = new UsernamePasswordAuthenticationToken(
                        userOpt.get(),
                        null,
                        List.of(new SimpleGrantedAuthority("ROLE_" + userOpt.get().getRole().getRoleName()))
                );
                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        filterChain.doFilter(request, response);
    }
}

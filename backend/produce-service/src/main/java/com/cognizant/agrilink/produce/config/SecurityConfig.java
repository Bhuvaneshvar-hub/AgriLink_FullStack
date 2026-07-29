package com.cognizant.agrilink.produce.config;

import com.cognizant.agrilink.produce.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // audit-logs
                .requestMatchers(HttpMethod.GET, "/audit-logs", "/audit-logs/**")
                    .hasAnyRole("ComplianceAnalyst", "AgriLinkAdmin")
                // ── produce-listings ──────────────────────────────────────────
                .requestMatchers(HttpMethod.GET, "/produce-listings", "/produce-listings/**")
                    .hasAnyRole("Farmer", "ExtensionOfficer", "ProcurementOfficer",
                                "SubsidyAdmin", "ComplianceAnalyst", "AgriLinkAdmin")
                .requestMatchers(HttpMethod.POST, "/produce-listings")
                    .hasAnyRole("Farmer", "ProcurementOfficer", "AgriLinkAdmin")
                .requestMatchers(HttpMethod.PUT, "/produce-listings/**")
                    .hasAnyRole("Farmer", "ProcurementOfficer", "AgriLinkAdmin")
                .requestMatchers(HttpMethod.DELETE, "/produce-listings/**")
                    .hasAnyRole("Farmer", "ProcurementOfficer", "AgriLinkAdmin")
                // ── produce-sales (Farmer NO, ExtensionOfficer NO) ────────────
                .requestMatchers(HttpMethod.GET, "/produce-sales", "/produce-sales/**")
                    .hasAnyRole("ProcurementOfficer", "SubsidyAdmin",
                                "ComplianceAnalyst", "AgriLinkAdmin")
                .requestMatchers(HttpMethod.POST, "/produce-sales")
                    .hasAnyRole("ProcurementOfficer", "AgriLinkAdmin")
                .requestMatchers(HttpMethod.PUT, "/produce-sales/**")
                    .hasAnyRole("ProcurementOfficer", "AgriLinkAdmin")
                .requestMatchers(HttpMethod.DELETE, "/produce-sales/**")
                    .hasAnyRole("ProcurementOfficer", "AgriLinkAdmin")
                // ── everything else ───────────────────────────────────────────
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

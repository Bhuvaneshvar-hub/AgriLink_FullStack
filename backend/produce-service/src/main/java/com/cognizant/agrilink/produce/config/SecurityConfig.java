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
                // Farmers create their own listings; Procurement may only update
                // (status) existing ones, never create or delete.
                .requestMatchers(HttpMethod.POST, "/produce-listings")
                    .hasAnyRole("Farmer", "AgriLinkAdmin")
                .requestMatchers(HttpMethod.PUT, "/produce-listings/**")
                    .hasAnyRole("Farmer", "ProcurementOfficer", "AgriLinkAdmin")
                .requestMatchers(HttpMethod.DELETE, "/produce-listings/**")
                    .hasAnyRole("Farmer", "AgriLinkAdmin")
                // ── produce-sales ─────────────────────────────────────────────
                // Farmer sees only their own sales (scoped in the controller);
                // all other authenticated roles may view.
                .requestMatchers(HttpMethod.GET, "/produce-sales", "/produce-sales/**")
                    .hasAnyRole("Farmer", "ExtensionOfficer", "ProcurementOfficer",
                                "SubsidyAdmin", "ComplianceAnalyst", "AgriLinkAdmin")
                // The selling farmer confirms they received a payment the buyer marked
                // Paid; ownership of the sale is enforced in the controller.
                .requestMatchers(HttpMethod.POST, "/produce-sales/*/farmer-confirmation")
                    .hasAnyRole("Farmer", "AgriLinkAdmin")
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

package com.cognizant.agrilink.notification.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.cognizant.agrilink.notification.security.JwtAuthFilter;

import lombok.RequiredArgsConstructor;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(csrf -> csrf.disable())
                .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // audit-logs
                        .requestMatchers(HttpMethod.GET, "/audit-logs", "/audit-logs/**")
                        .hasAnyRole("ComplianceAnalyst", "AgriLinkAdmin")
                        // notifications (all roles read; ExtensionOfficer + Admin publish/write)
                        .requestMatchers(HttpMethod.GET, "/notifications", "/notifications/**")
                        .hasAnyRole("Farmer", "ExtensionOfficer", "ProcurementOfficer", "SubsidyAdmin",
                                "ComplianceAnalyst", "AgriLinkAdmin")
                        // system/workflow-generated targeted alerts — any authenticated role
                        // (emitted by backend services on domain events). Must precede the
                        // restricted broadcast POST rule.
                        .requestMatchers(HttpMethod.POST, "/notifications/system")
                        .hasAnyRole("Farmer", "ExtensionOfficer", "ProcurementOfficer", "SubsidyAdmin",
                                "ComplianceAnalyst", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.POST, "/notifications")
                        .hasAnyRole("ExtensionOfficer", "AgriLinkAdmin")
                        // recipient inbox actions — any role may read/dismiss their own
                        // (ownership is enforced in the controller). Must precede the generic PUT rule.
                        .requestMatchers(HttpMethod.PUT, "/notifications/*/read", "/notifications/*/unread",
                                "/notifications/*/dismiss")
                        .hasAnyRole("Farmer", "ExtensionOfficer", "ProcurementOfficer", "SubsidyAdmin",
                                "ComplianceAnalyst", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.PUT, "/notifications/**")
                        .hasAnyRole("ExtensionOfficer", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.DELETE, "/notifications/**")
                        .hasAnyRole("ExtensionOfficer", "AgriLinkAdmin")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

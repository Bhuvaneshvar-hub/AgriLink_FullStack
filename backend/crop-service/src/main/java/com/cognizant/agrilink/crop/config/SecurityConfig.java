package com.cognizant.agrilink.crop.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.cognizant.agrilink.crop.security.JwtAuthFilter;

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
                        // crop-catalogs (reference data: all roles read; only Admin writes)
                        .requestMatchers(HttpMethod.GET, "/crop-catalogs", "/crop-catalogs/**")
                        .hasAnyRole("Farmer", "ExtensionOfficer", "ProcurementOfficer", "SubsidyAdmin",
                                "ComplianceAnalyst", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.POST, "/crop-catalogs").hasRole("AgriLinkAdmin")
                        .requestMatchers(HttpMethod.PUT, "/crop-catalogs/**").hasRole("AgriLinkAdmin")
                        .requestMatchers(HttpMethod.DELETE, "/crop-catalogs/**").hasRole("AgriLinkAdmin")
                        // crop-plans (Procurement NO access)
                        .requestMatchers(HttpMethod.GET, "/crop-plans", "/crop-plans/**")
                        .hasAnyRole("Farmer", "ExtensionOfficer", "SubsidyAdmin", "ComplianceAnalyst", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.POST, "/crop-plans").hasAnyRole("Farmer", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.PUT, "/crop-plans/**").hasAnyRole("Farmer", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.DELETE, "/crop-plans/**").hasAnyRole("Farmer", "AgriLinkAdmin")
                        // growth-observations (Farmer NO, Procurement NO)
                        .requestMatchers(HttpMethod.GET, "/growth-observations", "/growth-observations/**")
                        .hasAnyRole("ExtensionOfficer", "SubsidyAdmin", "ComplianceAnalyst", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.POST, "/growth-observations")
                        .hasAnyRole("ExtensionOfficer", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.PUT, "/growth-observations/**")
                        .hasAnyRole("ExtensionOfficer", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.DELETE, "/growth-observations/**")
                        .hasAnyRole("ExtensionOfficer", "AgriLinkAdmin")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

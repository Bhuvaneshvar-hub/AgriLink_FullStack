package com.cognizant.agrilink.farmer.config;

import com.cognizant.agrilink.farmer.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
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
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // public farmer self-registration (creates login + Inactive profile)
                        .requestMatchers(HttpMethod.POST, "/farmer-profiles/self-register").permitAll()
                        // audit-logs
                        .requestMatchers(HttpMethod.GET, "/audit-logs", "/audit-logs/**")
                        .hasAnyRole("ComplianceAnalyst", "AgriLinkAdmin")
                        // farmer-profiles
                        .requestMatchers(HttpMethod.GET, "/farmer-profiles", "/farmer-profiles/**")
                        .hasAnyRole("Farmer", "ExtensionOfficer", "ProcurementOfficer", "SubsidyAdmin", "ComplianceAnalyst", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.POST, "/farmer-profiles")
                        .hasAnyRole("Farmer", "AgriLinkAdmin")
                        // verify/activate/deactivate a farmer profile — Officer/Admin only (must precede the generic PUT rule)
                        .requestMatchers(HttpMethod.PUT, "/farmer-profiles/*/verify",
                                "/farmer-profiles/*/activate", "/farmer-profiles/*/deactivate")
                        .hasAnyRole("ExtensionOfficer", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.PUT, "/farmer-profiles/**")
                        .hasAnyRole("Farmer", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.DELETE, "/farmer-profiles/**")
                        .hasAnyRole("Farmer", "AgriLinkAdmin")
                        // land-holdings (Procurement Officer has NO access)
                        .requestMatchers(HttpMethod.GET, "/land-holdings", "/land-holdings/**")
                        .hasAnyRole("Farmer", "ExtensionOfficer", "SubsidyAdmin", "ComplianceAnalyst", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.POST, "/land-holdings")
                        .hasAnyRole("Farmer", "AgriLinkAdmin")
                        // approve/reject a land holding — Admin only (must precede the generic PUT rule)
                        .requestMatchers(HttpMethod.PUT, "/land-holdings/*/approve", "/land-holdings/*/reject")
                        .hasRole("AgriLinkAdmin")
                        .requestMatchers(HttpMethod.PUT, "/land-holdings/**")
                        .hasAnyRole("Farmer", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.DELETE, "/land-holdings/**")
                        .hasAnyRole("Farmer", "AgriLinkAdmin")
                        // crop-histories (Procurement Officer has NO access; officers may record field history)
                        .requestMatchers(HttpMethod.GET, "/crop-histories", "/crop-histories/**")
                        .hasAnyRole("Farmer", "ExtensionOfficer", "SubsidyAdmin", "ComplianceAnalyst", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.POST, "/crop-histories")
                        .hasAnyRole("Farmer", "ExtensionOfficer", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.PUT, "/crop-histories/**")
                        .hasAnyRole("Farmer", "ExtensionOfficer", "AgriLinkAdmin")
                        .requestMatchers(HttpMethod.DELETE, "/crop-histories/**")
                        .hasAnyRole("Farmer", "ExtensionOfficer", "AgriLinkAdmin")
                        .anyRequest().authenticated())
                .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}

package com.cognizant.agrilink.report.config;

import com.cognizant.agrilink.report.security.JwtAuthFilter;
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
                // permit error page, actuator, and swagger
                .requestMatchers("/error", "/actuator/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
                // reports endpoints
                .requestMatchers(HttpMethod.GET, "/reports/fetchAll", "/reports/fetchById/**", "/reports/fetchByScope/**")
                    .hasAnyRole("ExtensionOfficer", "ProcurementOfficer", "SubsidyAdmin",
                                "ComplianceAnalyst", "AgriLinkAdmin")
                .requestMatchers(HttpMethod.POST, "/reports/generate", "/reports/export")
                    .hasAnyRole("SubsidyAdmin", "ComplianceAnalyst", "AgriLinkAdmin")
                .requestMatchers(HttpMethod.DELETE, "/reports/delete/**")
                    .hasAnyRole("SubsidyAdmin", "ComplianceAnalyst", "AgriLinkAdmin")
                // dashboard, farmers, subsidy, produce analytics (accessible by all authenticated roles)
                .requestMatchers("/dashboard/**", "/farmers/**", "/subsidy/**", "/produce/**")
                    .hasAnyRole("Farmer", "ExtensionOfficer", "ProcurementOfficer", "SubsidyAdmin",
                                "ComplianceAnalyst", "AgriLinkAdmin")
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}

package com.cognizant.agrilink.iam.config;

import com.cognizant.agrilink.iam.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpMethod;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
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
                // Public endpoints
                .requestMatchers("/agriLink/session/login",
                                 "/agriLink/session/refresh",
                                 "/agriLink/session/register").permitAll()
                // Create user: Admin (any role) or ExtensionOfficer (Farmers only — enforced in service)
                .requestMatchers(HttpMethod.POST, "/agriLink/user/createUser")
                    .hasAnyRole("AgriLinkAdmin", "ExtensionOfficer")
                // Approve a pending (farmer self-registration) user
                .requestMatchers(HttpMethod.POST, "/agriLink/user/*/approve")
                    .hasAnyRole("AgriLinkAdmin", "ExtensionOfficer")
                // List users awaiting approval — Officer or Admin
                .requestMatchers(HttpMethod.GET, "/agriLink/user/pending")
                    .hasAnyRole("AgriLinkAdmin", "ExtensionOfficer")
                // Audit logs — Admin and ComplianceAnalyst
                .requestMatchers(HttpMethod.GET, "/agriLink/audit/**")
                    .hasAnyRole("AgriLinkAdmin", "ComplianceAnalyst")
                // All other user management + role management is Admin only
                .requestMatchers("/agriLink/user/**", "/agriLink/role/**").hasRole("AgriLinkAdmin")
                // All other endpoints require authentication
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config)
            throws Exception {
        return config.getAuthenticationManager();
    }
}

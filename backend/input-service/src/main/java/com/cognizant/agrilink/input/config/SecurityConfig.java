package com.cognizant.agrilink.input.config;

import com.cognizant.agrilink.input.security.JwtAuthFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
				.sessionManagement(session ->
						session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.authorizeHttpRequests(auth -> auth
						// audit-logs
						.requestMatchers(HttpMethod.GET, "/audit-logs", "/audit-logs/**")
						.hasAnyRole("ComplianceAnalyst", "AgriLinkAdmin")
						// catalogs = Input Catalog (Farmer NO access)
						.requestMatchers(HttpMethod.GET, "/catalogs", "/catalogs/**")
						.hasAnyRole("ExtensionOfficer", "ProcurementOfficer", "SubsidyAdmin",
								"ComplianceAnalyst", "AgriLinkAdmin")
						.requestMatchers(HttpMethod.POST, "/catalogs")
						.hasAnyRole("ProcurementOfficer", "AgriLinkAdmin")
						.requestMatchers(HttpMethod.PUT, "/catalogs/**")
						.hasAnyRole("ProcurementOfficer", "AgriLinkAdmin")
						.requestMatchers(HttpMethod.DELETE, "/catalogs/**")
						.hasAnyRole("ProcurementOfficer", "AgriLinkAdmin")
						// requests = Input Request
						.requestMatchers(HttpMethod.GET, "/requests", "/requests/**")
						.hasAnyRole("Farmer", "ExtensionOfficer", "ProcurementOfficer",
								"SubsidyAdmin", "ComplianceAnalyst", "AgriLinkAdmin")
						.requestMatchers(HttpMethod.POST, "/requests")
						.hasAnyRole("Farmer", "ExtensionOfficer", "ProcurementOfficer",
								"AgriLinkAdmin")
						.requestMatchers(HttpMethod.PUT, "/requests/**")
						.hasAnyRole("Farmer", "ExtensionOfficer", "ProcurementOfficer",
								"AgriLinkAdmin")
						.requestMatchers(HttpMethod.DELETE, "/requests/**")
						.hasAnyRole("Farmer", "ExtensionOfficer", "ProcurementOfficer",
								"AgriLinkAdmin")
						.anyRequest().authenticated())
				.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

		return http.build();
	}
}

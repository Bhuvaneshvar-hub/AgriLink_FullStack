package com.cognizant.agrilink.subsidy.config;

import com.cognizant.agrilink.subsidy.security.JwtAuthFilter;
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
						// permit error endpoint, actuator, and swagger
						.requestMatchers("/error", "/actuator/**", "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html").permitAll()
						// audit-logs
						.requestMatchers(HttpMethod.GET, "/audit-logs", "/audit-logs/**")
						.hasAnyRole("ComplianceAnalyst", "AgriLinkAdmin")
						// scheme-catalogs (read: all roles incl. Farmer, who needs it to apply; write: SubsidyAdmin/Admin)
						.requestMatchers(HttpMethod.GET, "/agriLink/subsidyScheme/fetchSchemes", "/agriLink/subsidyScheme/fetchSchemeById/**")
								.hasAnyRole("Farmer", "ExtensionOfficer", "ProcurementOfficer", "SubsidyAdmin",
										"ComplianceAnalyst", "AgriLinkAdmin")
						.requestMatchers(HttpMethod.POST, "/agriLink/subsidyScheme/createScheme")
								.hasAnyRole("SubsidyAdmin", "AgriLinkAdmin")
						.requestMatchers(HttpMethod.PUT, "/agriLink/subsidyScheme/updateScheme/**", "/agriLink/subsidyScheme/updateSchemeStatus/**")
								.hasAnyRole("SubsidyAdmin", "AgriLinkAdmin")
						.requestMatchers(HttpMethod.DELETE, "/agriLink/subsidyScheme/deleteScheme/**")
								.hasAnyRole("SubsidyAdmin", "AgriLinkAdmin")
						// subsidy-applications (Procurement NO access)
						.requestMatchers(HttpMethod.GET, "/agriLink/subsidyScheme/fetchApplications", "/agriLink/subsidyScheme/fetchApplicationById/**", "/agriLink/subsidyScheme/fetchApplicationsByFarmer/**")
								.hasAnyRole("Farmer", "ExtensionOfficer", "SubsidyAdmin",
										"ComplianceAnalyst", "AgriLinkAdmin")
						.requestMatchers(HttpMethod.POST, "/agriLink/subsidyScheme/createApplication")
								.hasAnyRole("Farmer", "ExtensionOfficer", "SubsidyAdmin", "AgriLinkAdmin")
						.requestMatchers(HttpMethod.PUT, "/agriLink/subsidyScheme/updateApplication/**", "/agriLink/subsidyScheme/reviewApplication/**", "/agriLink/subsidyScheme/updateApplicationStatus/**")
								.hasAnyRole("Farmer", "ExtensionOfficer", "SubsidyAdmin", "AgriLinkAdmin")
						.requestMatchers(HttpMethod.DELETE, "/agriLink/subsidyScheme/deleteApplication/**")
								.hasAnyRole("Farmer", "ExtensionOfficer", "SubsidyAdmin", "AgriLinkAdmin")
						.anyRequest().authenticated())
				.addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}
}

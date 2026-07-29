package com.cognizant.agrilink.iam.config;

import com.cognizant.agrilink.iam.identityAccess.model.UserDetails;
import com.cognizant.agrilink.iam.identityAccess.model.UserRole;
import com.cognizant.agrilink.iam.identityAccess.repository.UserDetailsRepository;
import com.cognizant.agrilink.iam.identityAccess.repository.UserRoleRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Seeds the first role + admin user on startup so the system is usable.
 * Idempotent: skips anything that already exists.
 */
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private static final String ADMIN_ROLE  = "AgriLinkAdmin";
    private static final String ADMIN_EMAIL = "admin@agrilink.com";
    private static final String ADMIN_PASSWORD = "Admin@1234";   // change after first login

    // The six static roles for the IAM module (roleName -> description)
    private static final Map<String, String> ROLES = new LinkedHashMap<>() {{
        put("AgriLinkAdmin",      "Full administrative access");
        put("ExtensionOfficer",   "Field officer — registers and verifies farmers");
        put("ProcurementOfficer", "Manages crop procurement");
        put("SubsidyAdmin",       "Reviews and approves subsidy applications");
        put("ComplianceAnalyst",  "Audits actions and ensures compliance");
        put("Farmer",             "Manages own crop plans and subsidy requests");
    }};

    private final UserRoleRepository    userRoleRepository;
    private final UserDetailsRepository userDetailsRepository;
    private final PasswordEncoder       passwordEncoder;

    @Override
    public void run(String... args) {

        // 1. Ensure all six roles exist (idempotent)
        ROLES.forEach((name, description) ->
                userRoleRepository.findByRoleName(name).orElseGet(() -> {
                    log.info("Seeding role: {}", name);
                    return userRoleRepository.save(UserRole.builder()
                            .roleName(name)
                            .description(description)
                            .status(UserRole.Status.A)
                            .build());
                }));

        UserRole adminRole = userRoleRepository.findByRoleName(ADMIN_ROLE)
                .orElseThrow(() -> new IllegalStateException("Admin role was not seeded"));

        // 2. Ensure the admin user exists
        if (!userDetailsRepository.existsByEmail(ADMIN_EMAIL)) {
            UserDetails admin = UserDetails.builder()
                    .role(adminRole)
                    .name("System Administrator")
                    .email(ADMIN_EMAIL)
                    .phone("0000000000")
                    .passwordHash(passwordEncoder.encode(ADMIN_PASSWORD))
                    .regionId(1)
                    .status(UserDetails.Status.A)
                    .build();
            userDetailsRepository.save(admin);
            log.info("Seeded admin user '{}' (password '{}') — change it after first login.",
                    ADMIN_EMAIL, ADMIN_PASSWORD);
        }
    }
}

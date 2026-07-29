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

    // Shared demo password for all seeded accounts — change after first login.
    private static final String DEMO_PASSWORD = "Agrilink@123";

    // The six static roles for the IAM module (roleName -> description)
    private static final Map<String, String> ROLES = new LinkedHashMap<>() {{
        put("AgriLinkAdmin",      "Full administrative access");
        put("ExtensionOfficer",   "Field officer — registers and verifies farmers");
        put("ProcurementOfficer", "Manages crop procurement");
        put("SubsidyAdmin",       "Reviews and approves subsidy applications");
        put("ComplianceAnalyst",  "Audits actions and ensures compliance");
        put("Farmer",             "Manages own crop plans and subsidy requests");
    }};

    // One demo login per role: email -> {roleName, display name, phone}
    private static final Map<String, String[]> DEMO_USERS = new LinkedHashMap<>() {{
        put("admin@agrilink.com",       new String[]{"AgriLinkAdmin",      "System Administrator", "9000000001"});
        put("officer@agrilink.com",     new String[]{"ExtensionOfficer",   "Extension Officer",    "9000000002"});
        put("procurement@agrilink.com", new String[]{"ProcurementOfficer", "Procurement Officer",  "9000000003"});
        put("subsidy@agrilink.com",     new String[]{"SubsidyAdmin",       "Subsidy Admin",        "9000000004"});
        put("compliance@agrilink.com",  new String[]{"ComplianceAnalyst",  "Compliance Analyst",   "9000000005"});
        put("farmer@agrilink.com",      new String[]{"Farmer",             "Demo Farmer",          "9000000006"});
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

        // 2. Ensure one active demo login exists per role (idempotent)
        DEMO_USERS.forEach((email, info) -> {
            if (!userDetailsRepository.existsByEmail(email)) {
                UserRole role = userRoleRepository.findByRoleName(info[0])
                        .orElseThrow(() -> new IllegalStateException("Role was not seeded: " + info[0]));
                UserDetails user = UserDetails.builder()
                        .role(role)
                        .name(info[1])
                        .email(email)
                        .phone(info[2])
                        .passwordHash(passwordEncoder.encode(DEMO_PASSWORD))
                        .regionId(1)
                        .status(UserDetails.Status.A)
                        .build();
                userDetailsRepository.save(user);
                log.info("Seeded demo user '{}' ({}) with password '{}' — change after first login.",
                        email, info[0], DEMO_PASSWORD);
            }
        });
    }
}

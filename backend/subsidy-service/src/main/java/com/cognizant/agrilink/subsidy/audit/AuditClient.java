package com.cognizant.agrilink.subsidy.audit;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Sends audit entries to the centralized audit API in iam-service.
 * Fire-and-forget (@Async) and fully fault-tolerant: a failure to reach
 * iam-service is logged but NEVER propagated to the business operation.
 */
@Component
@Slf4j
public class AuditClient {

    private static final String IAM_AUDIT_URL = "http://iam-service/agriLink/audit";

    private final RestTemplate restTemplate;

    public AuditClient(@Qualifier("auditRestTemplate") RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Async
    public void send(Integer userId, String action, String module, String ipAddress, String bearerToken) {
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("userId", userId);
            body.put("action", action);
            body.put("module", module);
            body.put("ipAddress", ipAddress);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            // Forward the caller's JWT so iam-service authenticates the request.
            if (bearerToken != null && !bearerToken.isBlank()) {
                headers.set(HttpHeaders.AUTHORIZATION, bearerToken);
            }

            restTemplate.postForEntity(IAM_AUDIT_URL, new HttpEntity<>(body, headers), Void.class);
        } catch (Exception e) {
            log.warn("Failed to send audit log to iam-service: {}", e.getMessage());
        }
    }
}

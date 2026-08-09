package com.cognizant.agrilink.farmer.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Best-effort sync: keeps a farmer's IAM login status in step with their
 * farmer_profile status when an officer/admin activates or deactivates the
 * profile from this service. Fire-and-forget and fully fault-tolerant — a
 * failure to reach iam-service is only logged, never propagated to the
 * caller's activate/deactivate operation.
 *
 * <p>Calls iam-service's dedicated {@code sync-activate}/{@code sync-deactivate}
 * endpoints rather than its public ones, so iam-service applies the status
 * change without cascading back here and creating a sync loop.</p>
 */
@Component
@Slf4j
public class IamStatusClient {

    private static final String ACTIVATE_URL   = "http://iam-service/agriLink/user/{userId}/sync-activate";
    private static final String DEACTIVATE_URL = "http://iam-service/agriLink/user/{userId}/sync-deactivate";

    private final RestTemplate restTemplate;

    public IamStatusClient(@Qualifier("auditRestTemplate") RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    @Async
    public void activate(Integer userId, String bearerToken) {
        sync(ACTIVATE_URL, userId, bearerToken);
    }

    @Async
    public void deactivate(Integer userId, String bearerToken) {
        sync(DEACTIVATE_URL, userId, bearerToken);
    }

    private void sync(String url, Integer userId, String bearerToken) {
        if (userId == null) {
            return;
        }
        try {
            HttpHeaders headers = new HttpHeaders();
            if (bearerToken != null && !bearerToken.isBlank()) {
                headers.set(HttpHeaders.AUTHORIZATION, bearerToken);
            }
            restTemplate.exchange(url, HttpMethod.PUT, new HttpEntity<>(headers), Void.class, userId);
        } catch (Exception e) {
            log.warn("Failed to sync iam-service user status for userId={}: {}", userId, e.getMessage());
        }
    }
}

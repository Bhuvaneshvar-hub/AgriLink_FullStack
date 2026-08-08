package com.cognizant.agrilink.iam.client;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Best-effort sync: keeps a farmer's farmer_profile status in step with their
 * IAM login status when an admin/officer activates, deactivates or approves
 * the login account. Fire-and-forget and fully fault-tolerant — a failure to
 * reach farmer-service is only logged, never propagated to the caller's
 * operation.
 *
 * <p>Calls farmer-service's dedicated {@code sync-activate}/{@code sync-deactivate}
 * by-user endpoints rather than its public ones, so farmer-service applies the
 * status change without cascading back here and creating a sync loop.</p>
 */
@Component
@Slf4j
public class FarmerStatusClient {

    private static final String ACTIVATE_URL =
            "http://farmer-service/agrilink/farmer/farmer-profiles/by-user/{userId}/sync-activate";
    private static final String DEACTIVATE_URL =
            "http://farmer-service/agrilink/farmer/farmer-profiles/by-user/{userId}/sync-deactivate";

    private final RestTemplate restTemplate;

    public FarmerStatusClient(@Qualifier("notificationRestTemplate") RestTemplate restTemplate) {
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
            log.warn("Failed to sync farmer-service profile status for userId={}: {}", userId, e.getMessage());
        }
    }
}

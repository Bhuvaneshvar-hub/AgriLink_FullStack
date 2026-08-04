package com.cognizant.agrilink.farmer.notification;

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
 * Emits targeted, workflow-generated alerts to notification-service on domain
 * events (e.g. a land holding being submitted / approved / rejected).
 *
 * <p>Fire-and-forget ({@code @Async}) and fully fault-tolerant: a failure to
 * reach notification-service is logged but NEVER propagated to the business
 * operation. The caller's JWT is captured on the request thread and forwarded
 * so notification-service authenticates the request.</p>
 */
@Component
@Slf4j
public class NotificationClient {

    private static final String NOTIFICATION_URL =
            "http://notification-service/agrilink/notification/notifications/system";

    private final RestTemplate restTemplate;

    public NotificationClient(@Qualifier("auditRestTemplate") RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    /**
     * @param bearerToken the caller's {@code Authorization} header, captured on the
     *                    request thread before this async call (the request-scoped
     *                    context is not available on the async worker thread).
     */
    @Async
    public void notify(Integer userId, String message, String category, String bearerToken) {
        if (userId == null) {
            return;
        }
        try {
            Map<String, Object> body = new HashMap<>();
            body.put("userId", userId);
            body.put("message", message);
            body.put("category", category);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            if (bearerToken != null && !bearerToken.isBlank()) {
                headers.set(HttpHeaders.AUTHORIZATION, bearerToken);
            }

            restTemplate.postForEntity(NOTIFICATION_URL, new HttpEntity<>(body, headers), Void.class);
        } catch (Exception e) {
            log.warn("Failed to send notification to notification-service: {}", e.getMessage());
        }
    }
}

package com.cognizant.agrilink.iam.notification;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.client.RestTemplate;

/**
 * Enables @Async (so notification calls are fire-and-forget) and provides a
 * load-balanced RestTemplate used only by {@link NotificationClient} to reach
 * notification-service via Eureka (http://notification-service/...).
 */
@Configuration
@EnableAsync
public class NotificationClientConfig {

    @Bean("notificationRestTemplate")
    @LoadBalanced
    public RestTemplate notificationRestTemplate() {
        return new RestTemplate();
    }
}

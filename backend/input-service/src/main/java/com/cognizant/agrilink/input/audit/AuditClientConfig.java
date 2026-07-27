package com.cognizant.agrilink.input.audit;

import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.web.client.RestTemplate;

/**
 * Enables @Async (so audit calls are fire-and-forget) and provides a
 * load-balanced RestTemplate used only by {@link AuditClient} to reach
 * iam-service via Eureka (http://iam-service/...).
 */
@Configuration
@EnableAsync
public class AuditClientConfig {

    @Bean("auditRestTemplate")
    @LoadBalanced
    public RestTemplate auditRestTemplate() {
        return new RestTemplate();
    }
}

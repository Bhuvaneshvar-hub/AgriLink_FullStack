package com.cognizant.agrilink.gateway.config;

import static org.springframework.cloud.gateway.server.mvc.filter.LoadBalancerFilterFunctions.lb;
import static org.springframework.cloud.gateway.server.mvc.filter.CircuitBreakerFilterFunctions.circuitBreaker;
import static org.springframework.cloud.gateway.server.mvc.handler.GatewayRouterFunctions.route;
import static org.springframework.cloud.gateway.server.mvc.handler.HandlerFunctions.http;
import static org.springframework.cloud.gateway.server.mvc.predicate.GatewayRequestPredicates.path;

import java.net.URI;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

/**
 * Dynamic, Eureka-based load-balanced routing with circuit breaker fallbacks.
 */
@Configuration
public class GatewayRoutesConfig {

	@Bean
	public RouterFunction<ServerResponse> iamRoute() {
		return route("iam-service")
				.route(path("/agriLink/session/**")
						.or(path("/agriLink/user/**"))
						.or(path("/agriLink/role/**"))
						.or(path("/agriLink/audit/**")), http())
				.filter(circuitBreaker("iamServiceCircuit", URI.create("forward:/fallback")))
				.filter(lb("iam-service"))
				.build();
	}

	@Bean
	public RouterFunction<ServerResponse> farmerRoute() {
		return route("farmer-service")
				.route(path("/agrilink/farmer/**"), http())
				.filter(circuitBreaker("farmerServiceCircuit", URI.create("forward:/fallback")))
				.filter(lb("farmer-service"))
				.build();
	}

	@Bean
	public RouterFunction<ServerResponse> cropRoute() {
		return route("crop-service")
				.route(path("/agrilink/crop/**"), http())
				.filter(circuitBreaker("cropServiceCircuit", URI.create("forward:/fallback")))
				.filter(lb("crop-service"))
				.build();
	}

	@Bean
	public RouterFunction<ServerResponse> inputRoute() {
		return route("input-service")
				.route(path("/agrilink/input/**"), http())
				.filter(circuitBreaker("inputServiceCircuit", URI.create("forward:/fallback")))
				.filter(lb("input-service"))
				.build();
	}

	@Bean
	public RouterFunction<ServerResponse> subsidyRoute() {
		return route("subsidy-service")
				.route(path("/agriLink/subsidyScheme/**"), http())
				.filter(circuitBreaker("subsidyServiceCircuit", URI.create("forward:/fallback")))
				.filter(lb("subsidy-service"))
				.build();
	}

	@Bean
	public RouterFunction<ServerResponse> produceRoute() {
		return route("produce-service")
				.route(path("/agrilink/produce/**"), http())
				.filter(circuitBreaker("produceServiceCircuit", URI.create("forward:/fallback")))
				.filter(lb("produce-service"))
				.build();
	}

	@Bean
	public RouterFunction<ServerResponse> reportRoute() {
		return route("report-service")
				.route(path("/agriLink/analytics/**"), http())
				.filter(circuitBreaker("reportServiceCircuit", URI.create("forward:/fallback")))
				.filter(lb("report-service"))
				.build();
	}

	@Bean
	public RouterFunction<ServerResponse> notificationRoute() {
		return route("notification-service")
				.route(path("/agrilink/notification/**"), http())
				.filter(circuitBreaker("notificationServiceCircuit", URI.create("forward:/fallback")))
				.filter(lb("notification-service"))
				.build();
	}
}

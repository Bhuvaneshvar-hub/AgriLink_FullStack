package com.cognizant.agrilink.gateway;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.web.servlet.function.RouterFunction;
import org.springframework.web.servlet.function.ServerResponse;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class GatewayServiceApplicationTests {

	@Autowired
	private List<RouterFunction<ServerResponse>> routes;

	@Test
	void contextLoads() {
		// Context loads and the gateway autoconfiguration is wired.
	}

	@Test
	void allEightServiceRoutesAreRegistered() {
		// At least one RouterFunction bean per downstream microservice (the
		// gateway autoconfiguration may contribute additional internal ones).
		assertThat(routes.size()).isGreaterThanOrEqualTo(8);
	}
}

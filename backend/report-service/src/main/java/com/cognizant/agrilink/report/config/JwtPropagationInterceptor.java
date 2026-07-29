package com.cognizant.agrilink.report.config;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import org.springframework.http.HttpRequest;
import org.springframework.http.client.ClientHttpRequestExecution;
import org.springframework.http.client.ClientHttpRequestInterceptor;
import org.springframework.http.client.ClientHttpResponse;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

public class JwtPropagationInterceptor implements ClientHttpRequestInterceptor {

	@Override
	public ClientHttpResponse intercept(HttpRequest request, byte[] body, ClientHttpRequestExecution execution) throws IOException {
		ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
		if (attributes != null) {
			HttpServletRequest servletRequest = attributes.getRequest();
			String authHeader = servletRequest.getHeader("Authorization");
			if (authHeader != null) {
				request.getHeaders().add("Authorization", authHeader);
			}
		}
		return execution.execute(request, body);
	}
}

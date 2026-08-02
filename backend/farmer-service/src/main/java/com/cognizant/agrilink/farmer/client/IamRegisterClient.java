package com.cognizant.agrilink.farmer.client;

import java.util.HashMap;
import java.util.Map;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Calls iam-service's PUBLIC self-registration endpoint to create the Farmer's
 * login account (Pending, awaiting approval). Returns the new userId so the
 * caller can link the FarmerProfile to it.
 */
@Component
@Slf4j
public class IamRegisterClient {

	private static final String IAM_REGISTER_URL = "http://iam-service/agriLink/session/register";
	private static final String IAM_REGISTER_ROLLBACK_URL = "http://iam-service/agriLink/session/register/{id}";

	private final RestTemplate restTemplate;

	public IamRegisterClient(@Qualifier("auditRestTemplate") RestTemplate restTemplate) {
		this.restTemplate = restTemplate;
	}

	/**
	 * Registers a Farmer login account in iam-service and returns the created userId.
	 * Throws {@link IllegalStateException} if iam-service rejects the registration
	 * (e.g. duplicate email) or returns no userId.
	 */
	@SuppressWarnings("unchecked")
	public Integer registerFarmer(String name, String email, String password, String phone, Integer regionId) {
		Map<String, Object> body = new HashMap<>();
		body.put("name", name);
		body.put("email", email);
		body.put("password", password);
		body.put("phone", phone);
		body.put("regionId", regionId);
		body.put("role", "Farmer");

		HttpHeaders headers = new HttpHeaders();
		headers.setContentType(MediaType.APPLICATION_JSON);

		try {
			Map<String, Object> resp = restTemplate.postForObject(
					IAM_REGISTER_URL, new HttpEntity<>(body, headers), Map.class);
			Object userId = (resp == null) ? null : resp.get("userId");
			if (userId == null) {
				throw new IllegalStateException("iam-service did not return a userId for the new account");
			}
			return ((Number) userId).intValue();
		} catch (org.springframework.web.client.HttpStatusCodeException e) {
			// Surface iam's validation message (e.g. "Email already registered") to the caller.
			String msg = e.getResponseBodyAsString();
			log.warn("iam-service register failed ({}): {}", e.getStatusCode(), msg);
			throw new IllegalStateException(extractMessage(msg));
		}
	}

	/**
	 * Best-effort rollback of the IAM account created by {@link #registerFarmer}, used
	 * when the local FarmerProfile save fails afterwards so the login account doesn't
	 * linger with no linked profile. Never throws — a failure here is only logged, so
	 * the caller's original error is what reaches the user.
	 */
	public void deleteRegistration(Integer userId) {
		try {
			restTemplate.delete(IAM_REGISTER_ROLLBACK_URL, userId);
		} catch (Exception e) {
			log.warn("Failed to roll back orphaned iam-service registration for userId={}: {}",
					userId, e.getMessage());
		}
	}

	private String extractMessage(String responseBody) {
		if (responseBody == null || responseBody.isBlank()) {
			return "Could not create login account";
		}
		// Best-effort pull of the "message" field without a full JSON parse dependency.
		int idx = responseBody.indexOf("\"message\"");
		if (idx >= 0) {
			int start = responseBody.indexOf(':', idx);
			int q1 = responseBody.indexOf('"', start + 1);
			int q2 = responseBody.indexOf('"', q1 + 1);
			if (q1 >= 0 && q2 > q1) {
				return responseBody.substring(q1 + 1, q2);
			}
		}
		return "Could not create login account";
	}
}

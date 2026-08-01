package com.cognizant.agrilink.produce.client;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Resolves, via farmer-service, which farmerId(s) belong to the authenticated
 * user. Used to enforce that a Farmer can only act on their own produce listings.
 *
 * <p>farmer-service's {@code GET /farmer-profiles} already scopes its response to
 * the caller's own profile(s) when the caller holds the Farmer role, so we simply
 * forward the caller's JWT and collect the returned farmerId(s).</p>
 */
@Component
@Slf4j
public class FarmerClient {

	private static final String FARMER_PROFILES_URL =
			"http://farmer-service/agrilink/farmer/farmer-profiles";

	private final RestTemplate restTemplate;

	public FarmerClient(@Qualifier("auditRestTemplate") RestTemplate restTemplate) {
		this.restTemplate = restTemplate;
	}

	/**
	 * Returns the farmerId(s) owned by the caller identified by {@code bearerToken}.
	 * On any failure to reach farmer-service, returns an empty list so the caller
	 * fails closed (a Farmer with no resolvable profiles can act on nothing).
	 */
	public List<Integer> getOwnedFarmerIds(String bearerToken) {
		try {
			HttpHeaders headers = new HttpHeaders();
			if (bearerToken != null && !bearerToken.isBlank()) {
				headers.set(HttpHeaders.AUTHORIZATION, bearerToken);
			}
			FarmerProfileRef[] profiles = restTemplate.exchange(
					FARMER_PROFILES_URL,
					org.springframework.http.HttpMethod.GET,
					new HttpEntity<>(headers),
					FarmerProfileRef[].class).getBody();

			if (profiles == null) {
				return Collections.emptyList();
			}
			return Arrays.stream(profiles)
					.map(FarmerProfileRef::getFarmerId)
					.filter(Objects::nonNull)
					.toList();
		} catch (Exception e) {
			log.warn("Failed to resolve owned farmer profiles from farmer-service: {}", e.getMessage());
			return Collections.emptyList();
		}
	}
}

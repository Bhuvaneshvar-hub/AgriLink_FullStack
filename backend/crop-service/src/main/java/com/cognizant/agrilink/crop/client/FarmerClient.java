package com.cognizant.agrilink.crop.client;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Objects;
import java.util.stream.Collectors;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

/**
 * Calls farmer-service to discover which farmer profiles belong to the
 * currently-authenticated user.
 *
 * <p>Used to scope crop-plan reads/writes so that a Farmer can only ever see or
 * modify their own plans — enforced server-side, not merely in the UI. A
 * technically-minded farmer calling {@code GET /crop-plans} directly must not be
 * able to see other farmers' data.</p>
 *
 * <p>farmer-service already scopes {@code GET /farmer-profiles} by the caller's
 * user id (derived from the JWT), so forwarding the caller's bearer token
 * returns exactly the profiles this user owns.</p>
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
     * The farmer-profile ids owned by the caller identified by the given bearer token.
     * Returns an empty list if the caller owns no profiles.
     */
    public List<Integer> getOwnedFarmerIds(String bearerToken) {
        HttpHeaders headers = new HttpHeaders();
        if (bearerToken != null && !bearerToken.isBlank()) {
            headers.set(HttpHeaders.AUTHORIZATION, bearerToken);
        }

        ResponseEntity<FarmerProfileRef[]> response = restTemplate.exchange(
                FARMER_PROFILES_URL, HttpMethod.GET, new HttpEntity<>(headers), FarmerProfileRef[].class);

        FarmerProfileRef[] profiles = response.getBody();
        if (profiles == null) {
            return Collections.emptyList();
        }
        return Arrays.stream(profiles)
                .map(FarmerProfileRef::getFarmerId)
                .filter(Objects::nonNull)
                .collect(Collectors.toList());
    }

    /** Minimal view of a farmer profile — we only need its id. */
    @JsonIgnoreProperties(ignoreUnknown = true)
    static class FarmerProfileRef {
        private Integer farmerId;

        public Integer getFarmerId() {
            return farmerId;
        }

        public void setFarmerId(Integer farmerId) {
            this.farmerId = farmerId;
        }
    }
}

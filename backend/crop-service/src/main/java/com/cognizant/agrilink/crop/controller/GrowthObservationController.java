package com.cognizant.agrilink.crop.controller;

import com.cognizant.agrilink.crop.client.FarmerClient;
import com.cognizant.agrilink.crop.dto.GrowthObservationDto;
import com.cognizant.agrilink.crop.dto.MessageResponse;
import com.cognizant.agrilink.crop.entity.CropPlan;
import com.cognizant.agrilink.crop.entity.GrowthObservation;
import com.cognizant.agrilink.crop.service.CropPlanService;
import com.cognizant.agrilink.crop.service.GrowthObservationService;
import java.util.List;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/growth-observations")
public class GrowthObservationController {

	private static final String ROLE_EXTENSION_OFFICER = "ROLE_ExtensionOfficer";
	private static final String ROLE_FARMER = "ROLE_Farmer";

	private final GrowthObservationService growthObservationService;
	private final CropPlanService cropPlanService;
	private final FarmerClient farmerClient;

	public GrowthObservationController(GrowthObservationService growthObservationService,
			CropPlanService cropPlanService, FarmerClient farmerClient) {
		this.growthObservationService = growthObservationService;
		this.cropPlanService = cropPlanService;
		this.farmerClient = farmerClient;
	}

	// GET methods return full data.
	// A Farmer sees only observations logged against their own crop plans; an
	// ExtensionOfficer sees only observations for crop plans belonging to farmers
	// in their own region; Admin and other officers see everything.
	@GetMapping
	public ResponseEntity<List<GrowthObservation>> getAll(Authentication authentication,
			@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String bearerToken) {
		if (hasAuthority(authentication, ROLE_FARMER) || hasAuthority(authentication, ROLE_EXTENSION_OFFICER)) {
			return ResponseEntity.ok(growthObservationService.getByPlanIds(scopedPlanIds(bearerToken)));
		}
		return ResponseEntity.ok(growthObservationService.getAll());
	}

	/**
	 * Plan ids the caller is entitled to see observations for. farmer-service scopes
	 * {@code GET /farmer-profiles} by the caller's own user id (Farmer) or region
	 * (ExtensionOfficer), so forwarding the bearer token yields exactly the right set.
	 */
	private List<Integer> scopedPlanIds(String bearerToken) {
		List<Integer> ownedFarmerIds = farmerClient.getOwnedFarmerIds(bearerToken);
		return cropPlanService.getByFarmerIds(ownedFarmerIds).stream()
				.map(CropPlan::getPlanId)
				.toList();
	}

	private boolean hasAuthority(Authentication authentication, String role) {
		if (authentication == null) {
			return false;
		}
		for (GrantedAuthority authority : authentication.getAuthorities()) {
			if (role.equals(authority.getAuthority())) {
				return true;
			}
		}
		return false;
	}

	@GetMapping("/{id}")
	public ResponseEntity<GrowthObservation> getById(@PathVariable Integer id, Authentication authentication,
			@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String bearerToken) {
		GrowthObservation observation = growthObservationService.getById(id);
		// Enforced server-side: a Farmer or ExtensionOfficer requesting an id outside
		// their own scope must not be able to read it directly.
		if ((hasAuthority(authentication, ROLE_FARMER) || hasAuthority(authentication, ROLE_EXTENSION_OFFICER))
				&& !scopedPlanIds(bearerToken).contains(observation.getPlanId())) {
			throw new AccessDeniedException("You can only view observations on your own crop plans");
		}
		return ResponseEntity.ok(observation);
	}

	// Non-GET methods return only a message
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody GrowthObservationDto dto) {
		growthObservationService.create(dto);
		return ResponseEntity.ok(new MessageResponse("GrowthObservation created successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody GrowthObservationDto dto) {
		growthObservationService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("GrowthObservation updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id) {
		growthObservationService.delete(id);
		return ResponseEntity.ok(new MessageResponse("GrowthObservation deleted successfully"));
	}
}

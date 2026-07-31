package com.cognizant.agrilink.crop.controller;

import com.cognizant.agrilink.crop.client.FarmerClient;
import com.cognizant.agrilink.crop.dto.CropPlanDto;
import com.cognizant.agrilink.crop.dto.MessageResponse;
import com.cognizant.agrilink.crop.entity.CropPlan;
import com.cognizant.agrilink.crop.service.CropPlanService;
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
@RequestMapping("/crop-plans")
public class CropPlanController {

	private static final String ROLE_FARMER = "ROLE_Farmer";

	private final CropPlanService cropPlanService;
	private final FarmerClient farmerClient;

	public CropPlanController(CropPlanService cropPlanService, FarmerClient farmerClient) {
		this.cropPlanService = cropPlanService;
		this.farmerClient = farmerClient;
	}

	// GET methods return full data.
	// A Farmer only ever sees plans belonging to their own farmer profiles;
	// officers/admins see everything. This is enforced here (server-side), so a
	// farmer calling the API directly cannot read other farmers' plans.
	@GetMapping
	public ResponseEntity<List<CropPlan>> getAll(Authentication authentication,
			@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String bearerToken) {
		if (isFarmer(authentication)) {
			List<Integer> ownedFarmerIds = farmerClient.getOwnedFarmerIds(bearerToken);
			return ResponseEntity.ok(cropPlanService.getByFarmerIds(ownedFarmerIds));
		}
		return ResponseEntity.ok(cropPlanService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<CropPlan> getById(@PathVariable Integer id, Authentication authentication,
			@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String bearerToken) {
		CropPlan cropPlan = cropPlanService.getById(id);
		if (isFarmer(authentication)
				&& !farmerClient.getOwnedFarmerIds(bearerToken).contains(cropPlan.getFarmerId())) {
			throw new AccessDeniedException("You can only view your own crop plans");
		}
		return ResponseEntity.ok(cropPlan);
	}

	// Non-GET methods return only a message.
	// A Farmer may only create/modify/delete plans for their own farmer
	// profiles; officers/admins are unrestricted.
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody CropPlanDto dto, Authentication authentication,
			@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String bearerToken) {
		assertFarmerOwns(authentication, bearerToken, dto.getFarmerId());
		cropPlanService.create(dto);
		return ResponseEntity.ok(new MessageResponse("CropPlan created successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody CropPlanDto dto,
			Authentication authentication,
			@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String bearerToken) {
		if (isFarmer(authentication)) {
			List<Integer> ownedFarmerIds = farmerClient.getOwnedFarmerIds(bearerToken);
			CropPlan existing = cropPlanService.getById(id);
			// Must own the plan being edited AND not re-assign it to another farmer.
			if (!ownedFarmerIds.contains(existing.getFarmerId())
					|| !ownedFarmerIds.contains(dto.getFarmerId())) {
				throw new AccessDeniedException("You can only update your own crop plans");
			}
		}
		cropPlanService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("CropPlan updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id, Authentication authentication,
			@RequestHeader(value = HttpHeaders.AUTHORIZATION, required = false) String bearerToken) {
		if (isFarmer(authentication)) {
			CropPlan existing = cropPlanService.getById(id);
			assertFarmerOwns(authentication, bearerToken, existing.getFarmerId());
		}
		cropPlanService.delete(id);
		return ResponseEntity.ok(new MessageResponse("CropPlan deleted successfully"));
	}

	private boolean isFarmer(Authentication authentication) {
		if (authentication == null) {
			return false;
		}
		for (GrantedAuthority authority : authentication.getAuthorities()) {
			if (ROLE_FARMER.equals(authority.getAuthority())) {
				return true;
			}
		}
		return false;
	}

	// Guard: a Farmer may only act on plans tied to one of their own profiles.
	private void assertFarmerOwns(Authentication authentication, String bearerToken, Integer farmerId) {
		if (isFarmer(authentication)
				&& !farmerClient.getOwnedFarmerIds(bearerToken).contains(farmerId)) {
			throw new AccessDeniedException("You can only manage your own crop plans");
		}
	}
}

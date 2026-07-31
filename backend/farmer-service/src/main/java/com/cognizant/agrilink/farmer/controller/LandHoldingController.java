package com.cognizant.agrilink.farmer.controller;

import com.cognizant.agrilink.farmer.dto.LandHoldingDto;
import com.cognizant.agrilink.farmer.dto.MessageResponse;
import com.cognizant.agrilink.farmer.entity.FarmerProfile;
import com.cognizant.agrilink.farmer.entity.LandHolding;
import com.cognizant.agrilink.farmer.enums.Status;
import com.cognizant.agrilink.farmer.service.FarmerProfileService;
import com.cognizant.agrilink.farmer.service.LandHoldingService;
import java.util.List;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/land-holdings")
public class LandHoldingController {

	private static final String ROLE_FARMER = "ROLE_Farmer";

	private final LandHoldingService landHoldingService;
	private final FarmerProfileService farmerProfileService;

	public LandHoldingController(LandHoldingService landHoldingService,
			FarmerProfileService farmerProfileService) {
		this.landHoldingService = landHoldingService;
		this.farmerProfileService = farmerProfileService;
	}

	// GET methods return full data.
	// A Farmer only ever sees land holdings tied to their own farmer profile(s); officers/admins see everything.
	@GetMapping
	public ResponseEntity<List<LandHolding>> getAll(Authentication authentication) {
		if (isFarmer(authentication)) {
			return ResponseEntity.ok(landHoldingService.getByFarmerIds(ownedFarmerIds(authentication)));
		}
		return ResponseEntity.ok(landHoldingService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<LandHolding> getById(@PathVariable Integer id, Authentication authentication) {
		LandHolding holding = landHoldingService.getById(id);
		if (isFarmer(authentication) && !ownedFarmerIds(authentication).contains(holding.getFarmerId())) {
			throw new AccessDeniedException("You can only view your own land holdings");
		}
		return ResponseEntity.ok(holding);
	}

	// Non-GET methods return only a message.
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody LandHoldingDto dto, Authentication authentication) {
		if (isFarmer(authentication)) {
			if (!ownedFarmerIds(authentication).contains(dto.getFarmerId())) {
				throw new AccessDeniedException("You can only register land holdings under your own farmer profile");
			}
			// Farmer-submitted holdings must go through admin approval.
			dto.setStatus(Status.PE);
		}
		landHoldingService.create(dto);
		return ResponseEntity.ok(new MessageResponse("LandHolding submitted"
				+ (isFarmer(authentication) ? " for approval" : " successfully")));
	}

	// Admin approves a (pending) land holding -> Active.
	@PutMapping("/{id}/approve")
	public ResponseEntity<MessageResponse> approve(@PathVariable Integer id) {
		landHoldingService.setStatus(id, Status.AC);
		return ResponseEntity.ok(new MessageResponse("LandHolding approved"));
	}

	// Admin rejects a (pending) land holding -> Disputed.
	@PutMapping("/{id}/reject")
	public ResponseEntity<MessageResponse> reject(@PathVariable Integer id) {
		landHoldingService.setStatus(id, Status.DP);
		return ResponseEntity.ok(new MessageResponse("LandHolding marked disputed"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody LandHoldingDto dto,
			Authentication authentication) {
		if (isFarmer(authentication)) {
			List<Integer> owned = ownedFarmerIds(authentication);
			LandHolding existing = landHoldingService.getById(id);
			if (!owned.contains(existing.getFarmerId()) || !owned.contains(dto.getFarmerId())) {
				throw new AccessDeniedException("You can only update your own land holdings");
			}
			// A farmer cannot change approval status via edit (no self-approval); preserve it.
			dto.setStatus(existing.getStatus());
		}
		landHoldingService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("LandHolding updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id, Authentication authentication) {
		if (isFarmer(authentication)) {
			LandHolding existing = landHoldingService.getById(id);
			if (!ownedFarmerIds(authentication).contains(existing.getFarmerId())) {
				throw new AccessDeniedException("You can only delete your own land holdings");
			}
		}
		landHoldingService.delete(id);
		return ResponseEntity.ok(new MessageResponse("LandHolding deleted successfully"));
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

	/** Resolves the farmerId(s) owned by the authenticated farmer via their profile(s). */
	private List<Integer> ownedFarmerIds(Authentication authentication) {
		Integer userId = (Integer) authentication.getPrincipal();
		return farmerProfileService.getByUserId(userId).stream()
				.map(FarmerProfile::getFarmerId)
				.toList();
	}
}

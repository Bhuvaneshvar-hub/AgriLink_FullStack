package com.cognizant.agrilink.farmer.controller;

import com.cognizant.agrilink.farmer.dto.CropHistoryDto;
import com.cognizant.agrilink.farmer.dto.MessageResponse;
import com.cognizant.agrilink.farmer.entity.CropHistory;
import com.cognizant.agrilink.farmer.service.CropHistoryService;
import com.cognizant.agrilink.farmer.service.FarmerProfileService;
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
@RequestMapping("/crop-histories")
public class CropHistoryController {

	private static final String ROLE_FARMER = "ROLE_Farmer";

	private final CropHistoryService cropHistoryService;
	private final FarmerProfileService farmerProfileService;

	public CropHistoryController(CropHistoryService cropHistoryService,
			FarmerProfileService farmerProfileService) {
		this.cropHistoryService = cropHistoryService;
		this.farmerProfileService = farmerProfileService;
	}

	// GET methods return full data.
	// A Farmer only ever sees crop history tied to their own farmer profile(s); officers/admins see everything.
	@GetMapping
	public ResponseEntity<List<CropHistory>> getAll(Authentication authentication) {
		if (isFarmer(authentication)) {
			return ResponseEntity.ok(cropHistoryService.getByFarmerIds(ownedFarmerIds(authentication)));
		}
		return ResponseEntity.ok(cropHistoryService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<CropHistory> getById(@PathVariable Integer id, Authentication authentication) {
		CropHistory history = cropHistoryService.getById(id);
		if (isFarmer(authentication) && !ownedFarmerIds(authentication).contains(history.getFarmerId())) {
			throw new AccessDeniedException("You can only view your own crop history");
		}
		return ResponseEntity.ok(history);
	}

	// Non-GET methods return only a message.
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody CropHistoryDto dto, Authentication authentication) {
		if (isFarmer(authentication) && !ownedFarmerIds(authentication).contains(dto.getFarmerId())) {
			throw new AccessDeniedException("You can only add crop history under your own farmer profile");
		}
		cropHistoryService.create(dto);
		return ResponseEntity.ok(new MessageResponse("CropHistory recorded successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody CropHistoryDto dto,
			Authentication authentication) {
		if (isFarmer(authentication)) {
			List<Integer> owned = ownedFarmerIds(authentication);
			CropHistory existing = cropHistoryService.getById(id);
			if (!owned.contains(existing.getFarmerId()) || !owned.contains(dto.getFarmerId())) {
				throw new AccessDeniedException("You can only update your own crop history");
			}
		}
		cropHistoryService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("CropHistory updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id, Authentication authentication) {
		if (isFarmer(authentication)) {
			CropHistory existing = cropHistoryService.getById(id);
			if (!ownedFarmerIds(authentication).contains(existing.getFarmerId())) {
				throw new AccessDeniedException("You can only delete your own crop history");
			}
		}
		cropHistoryService.delete(id);
		return ResponseEntity.ok(new MessageResponse("CropHistory deleted successfully"));
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
				.map(profile -> profile.getFarmerId())
				.toList();
	}
}

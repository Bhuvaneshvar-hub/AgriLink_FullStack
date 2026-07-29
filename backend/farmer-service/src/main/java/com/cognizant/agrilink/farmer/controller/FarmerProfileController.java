package com.cognizant.agrilink.farmer.controller;

import com.cognizant.agrilink.farmer.dto.FarmerProfileDto;
import com.cognizant.agrilink.farmer.dto.MessageResponse;
import com.cognizant.agrilink.farmer.entity.FarmerProfile;
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
@RequestMapping("/farmer-profiles")
public class FarmerProfileController {

	private final FarmerProfileService farmerProfileService;

	public FarmerProfileController(FarmerProfileService farmerProfileService) {
		this.farmerProfileService = farmerProfileService;
	}

	private static final String ROLE_FARMER = "ROLE_Farmer";

	// GET methods return full data.
	// A Farmer only ever sees their own profile; officers/admins see everything.
	@GetMapping
	public ResponseEntity<List<FarmerProfile>> getAll(Authentication authentication) {
		if (isFarmer(authentication)) {
			Integer userId = (Integer) authentication.getPrincipal();
			return ResponseEntity.ok(farmerProfileService.getByUserId(userId));
		}
		return ResponseEntity.ok(farmerProfileService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<FarmerProfile> getById(@PathVariable Integer id, Authentication authentication) {
		FarmerProfile profile = farmerProfileService.getById(id);
		if (isFarmer(authentication) && !authentication.getPrincipal().equals(profile.getUserId())) {
			throw new AccessDeniedException("You can only view your own profile");
		}
		return ResponseEntity.ok(profile);
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

	// Non-GET methods return only a message.
	// A Farmer may only create/modify their own profile; officers/admins are unrestricted.
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody FarmerProfileDto dto, Authentication authentication) {
		if (isFarmer(authentication)) {
			// A Farmer can only register a profile owned by themselves.
			dto.setUserId((Integer) authentication.getPrincipal());
		}
		farmerProfileService.create(dto);
		return ResponseEntity.ok(new MessageResponse("FarmerProfile created successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody FarmerProfileDto dto,
			Authentication authentication) {
		if (isFarmer(authentication)) {
			Integer userId = (Integer) authentication.getPrincipal();
			FarmerProfile existing = farmerProfileService.getById(id);
			if (!userId.equals(existing.getUserId())) {
				throw new AccessDeniedException("You can only update your own profile");
			}
			// Prevent a Farmer from re-assigning ownership of the profile.
			dto.setUserId(userId);
		}
		farmerProfileService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("FarmerProfile updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id, Authentication authentication) {
		if (isFarmer(authentication)) {
			Integer userId = (Integer) authentication.getPrincipal();
			FarmerProfile existing = farmerProfileService.getById(id);
			if (!userId.equals(existing.getUserId())) {
				throw new AccessDeniedException("You can only delete your own profile");
			}
		}
		farmerProfileService.delete(id);
		return ResponseEntity.ok(new MessageResponse("FarmerProfile deleted successfully"));
	}
}

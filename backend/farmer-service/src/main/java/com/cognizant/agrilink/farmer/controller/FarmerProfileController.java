package com.cognizant.agrilink.farmer.controller;

import com.cognizant.agrilink.farmer.client.IamStatusClient;
import com.cognizant.agrilink.farmer.dto.FarmerProfileDto;
import com.cognizant.agrilink.farmer.dto.MessageResponse;
import com.cognizant.agrilink.farmer.dto.SelfRegisterFarmerDto;
import com.cognizant.agrilink.farmer.entity.FarmerProfile;
import com.cognizant.agrilink.farmer.enums.Status;
import com.cognizant.agrilink.farmer.service.FarmerProfileService;
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
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

@RestController
@RequestMapping("/farmer-profiles")
public class FarmerProfileController {

	private final FarmerProfileService farmerProfileService;
	private final IamStatusClient iamStatusClient;

	public FarmerProfileController(FarmerProfileService farmerProfileService, IamStatusClient iamStatusClient) {
		this.farmerProfileService = farmerProfileService;
		this.iamStatusClient = iamStatusClient;
	}

	private static final String ROLE_FARMER = "ROLE_Farmer";
	private static final String ROLE_EXTENSION_OFFICER = "ROLE_ExtensionOfficer";

	// GET methods return full data.
	// A Farmer only ever sees their own profile; an ExtensionOfficer sees only
	// farmers in their own region (that's all they're able to approve/manage);
	// Admin and other officers see everything.
	@GetMapping
	public ResponseEntity<List<FarmerProfile>> getAll(Authentication authentication) {
		if (isFarmer(authentication)) {
			Integer userId = (Integer) authentication.getPrincipal();
			return ResponseEntity.ok(farmerProfileService.getByUserId(userId));
		}
		if (hasAuthority(authentication, ROLE_EXTENSION_OFFICER)) {
			Integer regionId = (Integer) authentication.getCredentials();
			return ResponseEntity.ok(farmerProfileService.getByRegionId(regionId));
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

	private boolean isFarmer(Authentication authentication) {
		return hasAuthority(authentication, ROLE_FARMER);
	}

	// Public farmer self-registration: creates the IAM login account (Pending) and a
	// linked Inactive FarmerProfile in one call. No authentication required.
	@PostMapping("/self-register")
	public ResponseEntity<MessageResponse> selfRegister(@RequestBody SelfRegisterFarmerDto dto) {
		farmerProfileService.selfRegister(dto);
		return ResponseEntity.ok(new MessageResponse(
				"Registration submitted. Your account is pending approval."));
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

	// Officer/admin verifies a farmer's identity/land records -> Verified.
	@PutMapping("/{id}/verify")
	public ResponseEntity<MessageResponse> verify(@PathVariable Integer id) {
		farmerProfileService.setStatus(id, Status.VE);
		return ResponseEntity.ok(new MessageResponse("FarmerProfile verified"));
	}

	// Officer/admin (re)activates a farmer profile -> Active. Cascades to iam-service
	// so the linked login account is reactivated too (see IamStatusClient).
	@PutMapping("/{id}/activate")
	public ResponseEntity<MessageResponse> activate(@PathVariable Integer id) {
		FarmerProfile profile = farmerProfileService.setStatus(id, Status.AC);
		iamStatusClient.activate(profile.getUserId(), currentBearerToken());
		return ResponseEntity.ok(new MessageResponse("FarmerProfile activated"));
	}

	// Officer/admin deactivates a farmer profile -> Inactive. Cascades to iam-service
	// so the linked login account is deactivated too (see IamStatusClient).
	@PutMapping("/{id}/deactivate")
	public ResponseEntity<MessageResponse> deactivate(@PathVariable Integer id) {
		FarmerProfile profile = farmerProfileService.setStatus(id, Status.IN);
		iamStatusClient.deactivate(profile.getUserId(), currentBearerToken());
		return ResponseEntity.ok(new MessageResponse("FarmerProfile deactivated"));
	}

	// Internal: called only by iam-service's own activate/deactivate cascade (UserService /
	// FarmerStatusClient) when the login account's status changes. Applies the status change
	// directly without calling back out to iam-service, which is what keeps the sync from looping.
	@PutMapping("/by-user/{userId}/sync-activate")
	public ResponseEntity<MessageResponse> syncActivate(@PathVariable Integer userId) {
		farmerProfileService.getByUserId(userId).stream().findFirst()
				.ifPresent(p -> farmerProfileService.setStatus(p.getFarmerId(), Status.AC));
		return ResponseEntity.ok(new MessageResponse("Synced"));
	}

	@PutMapping("/by-user/{userId}/sync-deactivate")
	public ResponseEntity<MessageResponse> syncDeactivate(@PathVariable Integer userId) {
		farmerProfileService.getByUserId(userId).stream().findFirst()
				.ifPresent(p -> farmerProfileService.setStatus(p.getFarmerId(), Status.IN));
		return ResponseEntity.ok(new MessageResponse("Synced"));
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

	/** Reads the caller's Authorization header on the request thread (for JWT forwarding). */
	private String currentBearerToken() {
		ServletRequestAttributes attributes =
				(ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
		return attributes != null ? attributes.getRequest().getHeader(HttpHeaders.AUTHORIZATION) : null;
	}
}

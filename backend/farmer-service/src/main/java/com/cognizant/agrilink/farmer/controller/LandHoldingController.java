package com.cognizant.agrilink.farmer.controller;

import com.cognizant.agrilink.farmer.dto.LandHoldingDto;
import com.cognizant.agrilink.farmer.dto.MessageResponse;
import com.cognizant.agrilink.farmer.entity.LandHolding;
import com.cognizant.agrilink.farmer.enums.Status;
import com.cognizant.agrilink.farmer.notification.NotificationClient;
import com.cognizant.agrilink.farmer.service.FarmerProfileService;
import com.cognizant.agrilink.farmer.service.LandHoldingService;
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
@RequestMapping("/land-holdings")
public class LandHoldingController {

	private static final String ROLE_FARMER = "ROLE_Farmer";
	private static final String ROLE_EXTENSION_OFFICER = "ROLE_ExtensionOfficer";
	private static final String NOTIF_CATEGORY = "Compliance";

	private final LandHoldingService landHoldingService;
	private final FarmerProfileService farmerProfileService;
	private final NotificationClient notificationClient;

	public LandHoldingController(LandHoldingService landHoldingService,
			FarmerProfileService farmerProfileService,
			NotificationClient notificationClient) {
		this.landHoldingService = landHoldingService;
		this.farmerProfileService = farmerProfileService;
		this.notificationClient = notificationClient;
	}

	// GET methods return full data.
	// A Farmer only ever sees land holdings tied to their own farmer profile(s); an
	// ExtensionOfficer sees only holdings belonging to farmers in their own region
	// (matching the farmer-profiles scoping); Admin and other officers see everything.
	@GetMapping
	public ResponseEntity<List<LandHolding>> getAll(Authentication authentication) {
		if (isFarmer(authentication)) {
			return ResponseEntity.ok(landHoldingService.getByFarmerIds(ownedFarmerIds(authentication)));
		}
		if (hasAuthority(authentication, ROLE_EXTENSION_OFFICER)) {
			Integer regionId = (Integer) authentication.getCredentials();
			List<Integer> regionFarmerIds = farmerProfileService.getByRegionId(regionId).stream()
					.map(profile -> profile.getFarmerId())
					.toList();
			return ResponseEntity.ok(landHoldingService.getByFarmerIds(regionFarmerIds));
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
		LandHolding saved = landHoldingService.create(dto);
		// Alert the owning farmer (and, since officers/admins see all notifications,
		// the approvers) that a new holding is awaiting approval.
		if (saved.getStatus() == Status.PE) {
			notifyOwner(saved.getFarmerId(),
					"Land holding " + saved.getSurveyNumber() + " submitted and is awaiting approval.");
		}
		return ResponseEntity.ok(new MessageResponse("LandHolding submitted"
				+ (isFarmer(authentication) ? " for approval" : " successfully")));
	}

	// Admin approves a (pending) land holding -> Active.
	@PutMapping("/{id}/approve")
	public ResponseEntity<MessageResponse> approve(@PathVariable Integer id, Authentication authentication) {
		LandHolding holding = landHoldingService.setStatus(id, Status.AC);
		notifyOwner(holding.getFarmerId(),
				"Your land holding " + holding.getSurveyNumber() + " has been approved.");
		// Confirmation for the acting officer/admin so the action shows in their own alerts.
		notifyActor(authentication,
				"You approved land holding " + holding.getSurveyNumber() + ".");
		return ResponseEntity.ok(new MessageResponse("LandHolding approved"));
	}

	// Admin rejects a (pending) land holding -> Disputed.
	@PutMapping("/{id}/reject")
	public ResponseEntity<MessageResponse> reject(@PathVariable Integer id, Authentication authentication) {
		LandHolding holding = landHoldingService.setStatus(id, Status.DP);
		notifyOwner(holding.getFarmerId(),
				"Your land holding " + holding.getSurveyNumber() + " was reviewed and marked disputed.");
		notifyActor(authentication,
				"You rejected land holding " + holding.getSurveyNumber() + " (marked disputed).");
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

	/** Resolves the farmerId(s) owned by the authenticated farmer via their profile(s). */
	private List<Integer> ownedFarmerIds(Authentication authentication) {
		Integer userId = (Integer) authentication.getPrincipal();
		return farmerProfileService.getByUserId(userId).stream()
				.map(profile -> profile.getFarmerId())
				.toList();
	}

	/**
	 * Emits a workflow alert to the farmer who owns {@code farmerId}. Best-effort:
	 * never lets a notification failure break the land-holding operation.
	 */
	private void notifyOwner(Integer farmerId, String message) {
		try {
			Integer ownerUserId = farmerProfileService.getById(farmerId).getUserId();
			notificationClient.notify(ownerUserId, message, NOTIF_CATEGORY, currentBearerToken());
		} catch (Exception e) {
			// Owner profile missing or notification unavailable — ignore.
		}
	}

	/**
	 * Emits a confirmation alert to the acting officer/admin (the JWT principal),
	 * so an approval/rejection always surfaces in the approver's own alerts even
	 * when the owning farmer has no linked login account. Best-effort.
	 */
	private void notifyActor(Authentication authentication, String message) {
		try {
			if (authentication != null && authentication.getPrincipal() instanceof Integer actorUserId) {
				notificationClient.notify(actorUserId, message, NOTIF_CATEGORY, currentBearerToken());
			}
		} catch (Exception e) {
			// Best-effort — never break the approval operation.
		}
	}

	/** Reads the caller's Authorization header on the request thread (for JWT forwarding). */
	private String currentBearerToken() {
		ServletRequestAttributes attributes =
				(ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
		return attributes != null ? attributes.getRequest().getHeader(HttpHeaders.AUTHORIZATION) : null;
	}
}

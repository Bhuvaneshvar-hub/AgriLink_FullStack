package com.cognizant.agrilink.produce.controller;

import com.cognizant.agrilink.produce.client.FarmerClient;
import com.cognizant.agrilink.produce.dto.MessageResponse;
import com.cognizant.agrilink.produce.dto.ProduceListingDto;
import com.cognizant.agrilink.produce.entity.ProduceListing;
import com.cognizant.agrilink.produce.service.ProduceListingService;
import jakarta.servlet.http.HttpServletRequest;
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
@RequestMapping("/produce-listings")
public class ProduceListingController {

	private static final String ROLE_FARMER = "ROLE_Farmer";

	private final ProduceListingService produceListingService;
	private final FarmerClient farmerClient;

	public ProduceListingController(ProduceListingService produceListingService,
			FarmerClient farmerClient) {
		this.produceListingService = produceListingService;
		this.farmerClient = farmerClient;
	}

	// A Farmer only ever sees listings tied to their own farmer profile(s);
	// officers/analysts/admin browse all (buyer matching, price discovery, oversight).
	@GetMapping
	public ResponseEntity<List<ProduceListing>> getAll(Authentication authentication, HttpServletRequest request) {
		if (isFarmer(authentication)) {
			return ResponseEntity.ok(produceListingService.getByFarmerIds(ownedFarmerIds(request)));
		}
		return ResponseEntity.ok(produceListingService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<ProduceListing> getById(@PathVariable Integer id,
			Authentication authentication, HttpServletRequest request) {
		ProduceListing listing = produceListingService.getById(id);
		if (isFarmer(authentication) && !ownedFarmerIds(request).contains(listing.getFarmerId())) {
			throw new AccessDeniedException("You can only view your own produce listings");
		}
		return ResponseEntity.ok(listing);
	}

	// Non-GET methods return only a message.
	// A Farmer may only create/modify listings under their own farmer profile(s);
	// ProcurementOfficer/AgriLinkAdmin retain unrestricted write access.
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody ProduceListingDto dto,
			Authentication authentication, HttpServletRequest request) {
		if (isFarmer(authentication) && !ownedFarmerIds(request).contains(dto.getFarmerId())) {
			throw new AccessDeniedException("You can only list produce under your own farmer profile");
		}
		produceListingService.create(dto);
		return ResponseEntity.ok(new MessageResponse("ProduceListing created successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody ProduceListingDto dto,
			Authentication authentication, HttpServletRequest request) {
		if (isFarmer(authentication)) {
			List<Integer> owned = ownedFarmerIds(request);
			ProduceListing existing = produceListingService.getById(id);
			if (!owned.contains(existing.getFarmerId()) || !owned.contains(dto.getFarmerId())) {
				throw new AccessDeniedException("You can only update your own produce listings");
			}
		}
		produceListingService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("ProduceListing updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id,
			Authentication authentication, HttpServletRequest request) {
		if (isFarmer(authentication)) {
			ProduceListing existing = produceListingService.getById(id);
			if (!ownedFarmerIds(request).contains(existing.getFarmerId())) {
				throw new AccessDeniedException("You can only delete your own produce listings");
			}
		}
		produceListingService.delete(id);
		return ResponseEntity.ok(new MessageResponse("ProduceListing deleted successfully"));
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

	/** Resolves the farmerId(s) owned by the caller via farmer-service, forwarding the JWT. */
	private List<Integer> ownedFarmerIds(HttpServletRequest request) {
		return farmerClient.getOwnedFarmerIds(request.getHeader("Authorization"));
	}
}

package com.cognizant.agrilink.produce.controller;

import com.cognizant.agrilink.produce.client.FarmerClient;
import com.cognizant.agrilink.produce.dto.MessageResponse;
import com.cognizant.agrilink.produce.dto.ProduceSaleDto;
import com.cognizant.agrilink.produce.entity.ProduceSale;
import com.cognizant.agrilink.produce.notification.NotificationClient;
import com.cognizant.agrilink.produce.service.ProduceSaleService;
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
@RequestMapping("/produce-sales")
public class ProduceSaleController {

	private static final String ROLE_FARMER = "ROLE_Farmer";
	private static final String NOTIF_CATEGORY = "ProduceSale";

	private final ProduceSaleService produceSaleService;
	private final FarmerClient farmerClient;
	private final NotificationClient notificationClient;

	public ProduceSaleController(ProduceSaleService produceSaleService, FarmerClient farmerClient,
			NotificationClient notificationClient) {
		this.produceSaleService = produceSaleService;
		this.farmerClient = farmerClient;
		this.notificationClient = notificationClient;
	}

	// A Farmer only ever sees sales whose listing belongs to their own farmer
	// profile(s); all other authorized roles view every sale.
	@GetMapping
	public ResponseEntity<List<ProduceSale>> getAll(Authentication authentication, HttpServletRequest request) {
		if (isFarmer(authentication)) {
			return ResponseEntity.ok(produceSaleService.getByOwnerFarmerIds(ownedFarmerIds(request)));
		}
		return ResponseEntity.ok(produceSaleService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<ProduceSale> getById(@PathVariable Integer id,
			Authentication authentication, HttpServletRequest request) {
		ProduceSale sale = produceSaleService.getById(id);
		if (isFarmer(authentication) && !produceSaleService.isSaleOwnedBy(sale, ownedFarmerIds(request))) {
			throw new AccessDeniedException("You can only view your own sales");
		}
		return ResponseEntity.ok(sale);
	}

	// Non-GET methods return only a message
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody ProduceSaleDto dto, HttpServletRequest request) {
		produceSaleService.create(dto);
		// Alert the selling farmer (listing owner) that a buyer booking/sale was recorded.
		notifySeller(dto, request);
		return ResponseEntity.ok(new MessageResponse("ProduceSale created successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody ProduceSaleDto dto) {
		produceSaleService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("ProduceSale updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id) {
		produceSaleService.delete(id);
		return ResponseEntity.ok(new MessageResponse("ProduceSale deleted successfully"));
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

	/**
	 * Notifies the farmer who owns the sold listing that a sale/booking was recorded.
	 * Best-effort: any failure resolving the owner or reaching notification-service is
	 * swallowed so it never breaks the sale operation.
	 */
	private void notifySeller(ProduceSaleDto dto, HttpServletRequest request) {
		try {
			String bearer = request.getHeader("Authorization");
			Integer farmerId = produceSaleService.getListingOwnerFarmerId(dto.getListingId());
			Integer ownerUserId = farmerClient.getUserIdByFarmerId(farmerId, bearer);
			if (ownerUserId != null) {
				String message = "A sale of " + dto.getQuantitySoldKg() + " kg was recorded for your produce listing #"
						+ dto.getListingId() + ".";
				notificationClient.notify(ownerUserId, message, NOTIF_CATEGORY, bearer);
			}
		} catch (Exception e) {
			// Notification is best-effort; never fail the sale.
		}
	}
}

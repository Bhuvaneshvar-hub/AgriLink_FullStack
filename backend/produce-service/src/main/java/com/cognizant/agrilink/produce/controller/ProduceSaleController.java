package com.cognizant.agrilink.produce.controller;

import com.cognizant.agrilink.produce.client.FarmerClient;
import com.cognizant.agrilink.produce.dto.MessageResponse;
import com.cognizant.agrilink.produce.dto.ProduceSaleDto;
import com.cognizant.agrilink.produce.entity.ProduceSale;
import com.cognizant.agrilink.produce.enums.PaymentStatus;
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
		if (dto.getPaymentStatus() == PaymentStatus.PD) {
			notifyPaymentMarkedPaid(dto.getListingId(), request);
		}
		return ResponseEntity.ok(new MessageResponse("ProduceSale created successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody ProduceSaleDto dto,
			HttpServletRequest request) {
		boolean alreadyPaid = isAlreadyPaid(id);
		produceSaleService.update(id, dto);
		// A fresh move to Paid is only the buyer's claim - ask the farmer to confirm receipt.
		if (!alreadyPaid && dto.getPaymentStatus() == PaymentStatus.PD) {
			notifyPaymentMarkedPaid(dto.getListingId(), request);
		}
		return ResponseEntity.ok(new MessageResponse("ProduceSale updated successfully"));
	}

	/**
	 * The selling farmer's own acknowledgement that the money arrived - a secondary
	 * check on the buyer having marked the sale Paid. A Farmer may only confirm a sale
	 * against one of their own listings.
	 */
	@PostMapping("/{id}/farmer-confirmation")
	public ResponseEntity<MessageResponse> confirmFarmerPayment(@PathVariable Integer id,
			Authentication authentication, HttpServletRequest request) {
		ProduceSale sale = produceSaleService.getById(id);
		if (isFarmer(authentication) && !produceSaleService.isSaleOwnedBy(sale, ownedFarmerIds(request))) {
			throw new AccessDeniedException("You can only confirm payments for your own sales");
		}
		ProduceSale confirmed = produceSaleService.confirmFarmerPayment(id);
		notifyBuyerOfConfirmation(confirmed, request);
		return ResponseEntity.ok(new MessageResponse("Payment receipt confirmed successfully"));
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

	/**
	 * Asks the selling farmer to confirm receipt after the buyer marks a settlement
	 * Paid. Best-effort, exactly like {@link #notifySeller}.
	 */
	private void notifyPaymentMarkedPaid(Integer listingId, HttpServletRequest request) {
		try {
			String bearer = request.getHeader("Authorization");
			Integer farmerId = produceSaleService.getListingOwnerFarmerId(listingId);
			Integer ownerUserId = farmerClient.getUserIdByFarmerId(farmerId, bearer);
			if (ownerUserId != null) {
				String message = "A payment for your produce listing #" + listingId
						+ " was marked as Paid. Please confirm in the Produce Market that you received it.";
				notificationClient.notify(ownerUserId, message, NOTIF_CATEGORY, bearer);
			}
		} catch (Exception e) {
			// Notification is best-effort; never fail the update.
		}
	}

	/** Tells the buyer their payment was acknowledged by the farmer. Best-effort. */
	private void notifyBuyerOfConfirmation(ProduceSale sale, HttpServletRequest request) {
		try {
			if (sale == null || sale.getBuyerId() == null) {
				return;
			}
			String message = "The farmer confirmed receiving your payment for sale #" + sale.getSaleId()
					+ " (listing #" + sale.getListingId() + ").";
			notificationClient.notify(sale.getBuyerId(), message, NOTIF_CATEGORY,
					request.getHeader("Authorization"));
		} catch (Exception e) {
			// Notification is best-effort; never fail the confirmation.
		}
	}

	/**
	 * Pre-update payment status, used to fire the farmer confirmation request only on a
	 * fresh transition into Paid. Resolves to {@code false} if the sale cannot be read.
	 */
	private boolean isAlreadyPaid(Integer id) {
		try {
			ProduceSale existing = produceSaleService.getById(id);
			return existing != null && existing.getPaymentStatus() == PaymentStatus.PD;
		} catch (Exception e) {
			return false;
		}
	}
}

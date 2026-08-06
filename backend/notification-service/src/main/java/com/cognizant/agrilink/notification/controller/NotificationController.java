package com.cognizant.agrilink.notification.controller;

import com.cognizant.agrilink.notification.dto.MessageResponse;
import com.cognizant.agrilink.notification.dto.NotificationDto;
import com.cognizant.agrilink.notification.entity.Notification;
import com.cognizant.agrilink.notification.enums.NotificationStatus;
import com.cognizant.agrilink.notification.service.NotificationService;
import java.util.List;
import java.util.Map;
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
@RequestMapping("/notifications")
public class NotificationController {

	private static final String ROLE_FARMER = "ROLE_Farmer";

	private final NotificationService notificationService;

	public NotificationController(NotificationService notificationService) {
		this.notificationService = notificationService;
	}

	// GET methods return full data.
	// Notifications are personal alerts — every role, including officers/admins, only
	// ever sees their own inbox here (identical to /me). There is intentionally no
	// "view everyone's notifications" mode; that would leak other users' alerts.
	@GetMapping
	public ResponseEntity<List<Notification>> getAll(Authentication authentication) {
		return ResponseEntity.ok(notificationService.getByUserId(currentUserId(authentication)));
	}

	// The authenticated user's own inbox — for any role.
	@GetMapping("/me")
	public ResponseEntity<List<Notification>> getMine(Authentication authentication) {
		return ResponseEntity.ok(notificationService.getByUserId(currentUserId(authentication)));
	}

	// Unread badge count for the authenticated user's own inbox.
	@GetMapping("/unread-count")
	public ResponseEntity<Map<String, Long>> unreadCount(Authentication authentication) {
		return ResponseEntity.ok(Map.of("unread", notificationService.unreadCount(currentUserId(authentication))));
	}

	@GetMapping("/{id}")
	public ResponseEntity<Notification> getById(@PathVariable Integer id, Authentication authentication) {
		Notification notification = notificationService.getById(id);
		if (isFarmer(authentication) && !currentUserId(authentication).equals(notification.getUserId())) {
			throw new AccessDeniedException("You can only view your own notifications");
		}
		return ResponseEntity.ok(notification);
	}

	// Non-GET methods return only a message.
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody NotificationDto dto) {
		notificationService.create(dto);
		return ResponseEntity.ok(new MessageResponse("Notification created successfully"));
	}

	
	@PostMapping("/system")
	public ResponseEntity<MessageResponse> createSystem(@RequestBody NotificationDto dto) {
		notificationService.create(dto);
		return ResponseEntity.ok(new MessageResponse("Notification created"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody NotificationDto dto) {
		notificationService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("Notification updated successfully"));
	}

	// Recipient inbox actions — the recipient (or an officer/admin) may change read state.
	@PutMapping("/{id}/read")
	public ResponseEntity<MessageResponse> markRead(@PathVariable Integer id, Authentication authentication) {
		changeStatus(id, NotificationStatus.RD, authentication);
		return ResponseEntity.ok(new MessageResponse("Notification marked as read"));
	}

	@PutMapping("/{id}/unread")
	public ResponseEntity<MessageResponse> markUnread(@PathVariable Integer id, Authentication authentication) {
		changeStatus(id, NotificationStatus.UN, authentication);
		return ResponseEntity.ok(new MessageResponse("Notification marked as unread"));
	}

	@PutMapping("/{id}/dismiss")
	public ResponseEntity<MessageResponse> dismiss(@PathVariable Integer id, Authentication authentication) {
		changeStatus(id, NotificationStatus.DI, authentication);
		return ResponseEntity.ok(new MessageResponse("Notification dismissed"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id) {
		notificationService.delete(id);
		return ResponseEntity.ok(new MessageResponse("Notification deleted successfully"));
	}

	// A Farmer may only change the state of a notification addressed to them.
	private void changeStatus(Integer id, NotificationStatus status, Authentication authentication) {
		if (isFarmer(authentication)) {
			Notification existing = notificationService.getById(id);
			if (!currentUserId(authentication).equals(existing.getUserId())) {
				throw new AccessDeniedException("You can only update your own notifications");
			}
		}
		notificationService.setStatus(id, status);
	}

	private Integer currentUserId(Authentication authentication) {
    if (authentication == null) {
        throw new AccessDeniedException("Authentication required");
    }
    return (Integer) authentication.getPrincipal();
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
}

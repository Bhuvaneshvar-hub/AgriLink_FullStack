package com.cognizant.agrilink.notification.controller;

import com.cognizant.agrilink.notification.dto.MessageResponse;
import com.cognizant.agrilink.notification.dto.NotificationDto;
import com.cognizant.agrilink.notification.entity.Notification;
import com.cognizant.agrilink.notification.service.NotificationService;
import java.util.List;
import org.springframework.http.ResponseEntity;
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

	private final NotificationService notificationService;

	public NotificationController(NotificationService notificationService) {
		this.notificationService = notificationService;
	}

	// GET methods return full data
	@GetMapping
	public ResponseEntity<List<Notification>> getAll() {
		return ResponseEntity.ok(notificationService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<Notification> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(notificationService.getById(id));
	}

	// Non-GET methods return only a message
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody NotificationDto dto) {
		notificationService.create(dto);
		return ResponseEntity.ok(new MessageResponse("Notification created successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody NotificationDto dto) {
		notificationService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("Notification updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id) {
		notificationService.delete(id);
		return ResponseEntity.ok(new MessageResponse("Notification deleted successfully"));
	}
}

package com.cognizant.agrilink.notification.service;

import com.cognizant.agrilink.notification.dto.NotificationDto;
import com.cognizant.agrilink.notification.entity.Notification;
import com.cognizant.agrilink.notification.enums.NotificationStatus;
import com.cognizant.agrilink.notification.repository.NotificationRepository;
import com.cognizant.agrilink.notification.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

	private final NotificationRepository notificationRepository;

	public NotificationService(NotificationRepository notificationRepository) {
		this.notificationRepository = notificationRepository;
	}

	public List<Notification> getAll() {
		return notificationRepository.findAll();
	}

	public Notification getById(Integer id) {
		return notificationRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Notification not found with id " + id));
	}

	public Notification create(NotificationDto dto) {
		Notification notification = Notification.builder()
				.userId(dto.getUserId())
				.message(dto.getMessage())
				.category(dto.getCategory())
				.status(dto.getStatus() != null ? dto.getStatus() : NotificationStatus.UN)
				.createdDate(dto.getCreatedDate())
				.build();
		return notificationRepository.save(notification);
	}

	public Notification update(Integer id, NotificationDto dto) {
		Notification notification = getById(id);
		notification.setUserId(dto.getUserId());
		notification.setMessage(dto.getMessage());
		notification.setCategory(dto.getCategory());
		notification.setStatus(dto.getStatus());
		notification.setCreatedDate(dto.getCreatedDate());
		return notificationRepository.save(notification);
	}

	public void delete(Integer id) {
		Notification notification = getById(id);
		notificationRepository.delete(notification);
	}
}

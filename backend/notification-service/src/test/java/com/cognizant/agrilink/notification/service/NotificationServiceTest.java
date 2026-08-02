package com.cognizant.agrilink.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.notification.dto.NotificationDto;
import com.cognizant.agrilink.notification.entity.Notification;
import com.cognizant.agrilink.notification.enums.NotificationCategory;
import com.cognizant.agrilink.notification.enums.NotificationStatus;
import com.cognizant.agrilink.notification.repository.NotificationRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceTest {

	@Mock
	private NotificationRepository notificationRepository;

	@InjectMocks
	private NotificationService notificationService;

	private Notification notification;
	private NotificationDto dto;

	@BeforeEach
	void setUp() {
		notification = Notification.builder()
				.notificationId(1)
				.userId(1)
				.message("Sowing reminder")
				.category(NotificationCategory.CropAdvisory)
				.status(NotificationStatus.UN)
				.createdDate(LocalDate.of(2026, 6, 15))
				.build();
		dto = NotificationDto.builder()
				.userId(1)
				.message("Sowing reminder")
				.category(NotificationCategory.CropAdvisory)
				.status(NotificationStatus.UN)
				.createdDate(LocalDate.of(2026, 6, 15))
				.build();
	}

	@Test
	void getAllReturnsList() {
		when(notificationRepository.findAll()).thenReturn(List.of(notification));

		assertThat(notificationService.getAll()).hasSize(1);
		verify(notificationRepository).findAll();
	}

	@Test
	void getByIdReturnsRecord() {
		when(notificationRepository.findById(1)).thenReturn(Optional.of(notification));

		assertThat(notificationService.getById(1).getMessage()).isEqualTo("Sowing reminder");
	}

	@Test
	void getByIdThrowsWhenMissing() {
		when(notificationRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> notificationService.getById(99))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@Test
	void createSavesRecord() {
		when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

		notificationService.create(dto);

		verify(notificationRepository).save(any(Notification.class));
	}

	@Test
	void updateModifiesRecord() {
		when(notificationRepository.findById(1)).thenReturn(Optional.of(notification));
		when(notificationRepository.save(any(Notification.class))).thenReturn(notification);

		notificationService.update(1, dto);

		verify(notificationRepository).save(any(Notification.class));
	}

	@Test
	void deleteRemovesRecord() {
		when(notificationRepository.findById(1)).thenReturn(Optional.of(notification));

		notificationService.delete(1);

		verify(notificationRepository, times(1)).delete(notification);
	}
}

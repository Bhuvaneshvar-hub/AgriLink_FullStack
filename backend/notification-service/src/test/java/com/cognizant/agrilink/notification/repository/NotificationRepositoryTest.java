package com.cognizant.agrilink.notification.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.notification.entity.Notification;
import com.cognizant.agrilink.notification.enums.NotificationStatus;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class NotificationRepositoryTest {

	@Autowired
	private NotificationRepository notificationRepository;

	private Notification buildNotification() {
		return Notification.builder()
				.userId(1)
				.message("Sowing reminder")
				.category("CropAdvisory")
				.status(NotificationStatus.UN)
				.createdDate(LocalDate.of(2026, 6, 15))
				.build();
	}

	@Test
	void saveAndFindById() {
		Notification saved = notificationRepository.save(buildNotification());

		Notification found = notificationRepository.findById(saved.getNotificationId()).orElseThrow();

		assertThat(found.getMessage()).isEqualTo("Sowing reminder");
		assertThat(found.getCategory()).isEqualTo("CropAdvisory");
	}

	@Test
	void findAllReturnsSavedRecords() {
		notificationRepository.save(buildNotification());
		notificationRepository.save(buildNotification());

		assertThat(notificationRepository.findAll()).hasSize(2);
	}

	@Test
	void deleteRemovesRecord() {
		Notification saved = notificationRepository.save(buildNotification());

		notificationRepository.deleteById(saved.getNotificationId());

		assertThat(notificationRepository.findById(saved.getNotificationId())).isEmpty();
	}
}

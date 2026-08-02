package com.cognizant.agrilink.notification.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.notification.entity.Notification;
import com.cognizant.agrilink.notification.enums.NotificationCategory;
import com.cognizant.agrilink.notification.enums.NotificationStatus;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class NotificationRepositoryExtendedTest {

	@Autowired
	private NotificationRepository notificationRepository;

	private Notification buildNotification() {
		return Notification.builder()
				.userId(1)
				.message("Sowing reminder")
				.category(NotificationCategory.CropAdvisory)
				.status(NotificationStatus.UN)
				.createdDate(LocalDate.of(2026, 6, 15))
				.build();
	}

	private static Stream<Arguments> notificationFields() {
		return Stream.of(
				Arguments.of("Sowing window opens next week", NotificationCategory.CropAdvisory, NotificationStatus.UN),
				Arguments.of("Your subsidy is approved", NotificationCategory.Subsidy, NotificationStatus.RD),
				Arguments.of("Seed order confirmed", NotificationCategory.InputProcurement, NotificationStatus.UN),
				Arguments.of("Produce listed for sale", NotificationCategory.ProduceSale, NotificationStatus.UN),
				Arguments.of("Compliance document due", NotificationCategory.Compliance, NotificationStatus.RD),
				Arguments.of("Pesticide advisory issued", NotificationCategory.CropAdvisory, NotificationStatus.UN),
				Arguments.of("Fertilizer subsidy released", NotificationCategory.Subsidy, NotificationStatus.UN),
				Arguments.of("Tractor rental confirmed", NotificationCategory.InputProcurement, NotificationStatus.RD));
	}

	private static Stream<Arguments> dateArguments() {
		return Stream.of(
				Arguments.of(LocalDate.of(2020, 1, 1)),
				Arguments.of(LocalDate.of(2024, 2, 29)),
				Arguments.of(LocalDate.of(2026, 6, 15)),
				Arguments.of(LocalDate.of(2030, 12, 31)),
				Arguments.of(LocalDate.of(2000, 2, 29)),
				Arguments.of(LocalDate.of(2099, 7, 4)));
	}

	@Test
	void saveAssignsGeneratedId() {
		Notification saved = notificationRepository.save(buildNotification());

		assertThat(saved.getNotificationId()).isNotNull();
	}

	@Test
	void saveAndFindByIdReturnsRecord() {
		Notification saved = notificationRepository.save(buildNotification());

		Notification found = notificationRepository.findById(saved.getNotificationId()).orElseThrow();

		assertThat(found.getMessage()).isEqualTo("Sowing reminder");
		assertThat(found.getCategory()).isEqualTo(NotificationCategory.CropAdvisory);
		assertThat(found.getStatus()).isEqualTo(NotificationStatus.UN);
		assertThat(found.getUserId()).isEqualTo(1);
		assertThat(found.getCreatedDate()).isEqualTo(LocalDate.of(2026, 6, 15));
	}

	@Test
	void findByIdReturnsEmptyWhenMissing() {
		assertThat(notificationRepository.findById(9999)).isEmpty();
	}

	@Test
	void findAllReturnsEmptyInitially() {
		assertThat(notificationRepository.findAll()).isEmpty();
	}

	@Test
	void findAllReturnsManyRecords() {
		notificationRepository.save(buildNotification());
		notificationRepository.save(buildNotification());
		notificationRepository.save(buildNotification());

		assertThat(notificationRepository.findAll()).hasSize(3);
	}

	@Test
	void countReturnsZeroInitially() {
		assertThat(notificationRepository.count()).isZero();
	}

	@Test
	void countReflectsSavedRecords() {
		notificationRepository.save(buildNotification());
		notificationRepository.save(buildNotification());

		assertThat(notificationRepository.count()).isEqualTo(2);
	}

	@Test
	void existsByIdReturnsTrueWhenPresent() {
		Notification saved = notificationRepository.save(buildNotification());

		assertThat(notificationRepository.existsById(saved.getNotificationId())).isTrue();
	}

	@Test
	void existsByIdReturnsFalseWhenAbsent() {
		assertThat(notificationRepository.existsById(8888)).isFalse();
	}

	@Test
	void saveAllPersistsAllRecords() {
		List<Notification> records = List.of(buildNotification(), buildNotification(), buildNotification());

		notificationRepository.saveAll(records);

		assertThat(notificationRepository.count()).isEqualTo(3);
	}

	@Test
	void deleteRemovesRecord() {
		Notification saved = notificationRepository.save(buildNotification());

		notificationRepository.delete(saved);

		assertThat(notificationRepository.findById(saved.getNotificationId())).isEmpty();
	}

	@Test
	void deleteByIdRemovesRecord() {
		Notification saved = notificationRepository.save(buildNotification());

		notificationRepository.deleteById(saved.getNotificationId());

		assertThat(notificationRepository.findById(saved.getNotificationId())).isEmpty();
	}

	@Test
	void deleteAllRemovesEverything() {
		notificationRepository.save(buildNotification());
		notificationRepository.save(buildNotification());

		notificationRepository.deleteAll();

		assertThat(notificationRepository.count()).isZero();
	}

	@Test
	void updatePersistsChanges() {
		Notification saved = notificationRepository.save(buildNotification());

		saved.setStatus(NotificationStatus.RD);
		saved.setMessage("Updated reminder");
		notificationRepository.save(saved);

		Notification found = notificationRepository.findById(saved.getNotificationId()).orElseThrow();
		assertThat(found.getStatus()).isEqualTo(NotificationStatus.RD);
		assertThat(found.getMessage()).isEqualTo("Updated reminder");
	}

	// ── Derived query methods ─────────────────────────────────────────────

	@Test
	void findByUserIdReturnsOnlyMatchingRecipient() {
		Notification mine = buildNotification();
		mine.setUserId(11);
		Notification other = buildNotification();
		other.setUserId(22);
		notificationRepository.save(mine);
		notificationRepository.save(other);

		List<Notification> found = notificationRepository.findByUserId(11);

		assertThat(found).hasSize(1);
		assertThat(found.get(0).getUserId()).isEqualTo(11);
	}

	@Test
	void findByUserIdReturnsEmptyWhenNoneForUser() {
		Notification other = buildNotification();
		other.setUserId(22);
		notificationRepository.save(other);

		assertThat(notificationRepository.findByUserId(11)).isEmpty();
	}

	@Test
	void findByUserIdAndStatusFiltersByBoth() {
		Notification unread = buildNotification();
		unread.setUserId(11);
		unread.setStatus(NotificationStatus.UN);
		Notification read = buildNotification();
		read.setUserId(11);
		read.setStatus(NotificationStatus.RD);
		Notification otherUser = buildNotification();
		otherUser.setUserId(22);
		otherUser.setStatus(NotificationStatus.UN);
		notificationRepository.save(unread);
		notificationRepository.save(read);
		notificationRepository.save(otherUser);

		List<Notification> found = notificationRepository.findByUserIdAndStatus(11, NotificationStatus.UN);

		assertThat(found).hasSize(1);
		assertThat(found.get(0).getUserId()).isEqualTo(11);
		assertThat(found.get(0).getStatus()).isEqualTo(NotificationStatus.UN);
	}

	@Test
	void countByUserIdAndStatusCountsMatching() {
		Notification unreadA = buildNotification();
		unreadA.setUserId(11);
		unreadA.setStatus(NotificationStatus.UN);
		Notification unreadB = buildNotification();
		unreadB.setUserId(11);
		unreadB.setStatus(NotificationStatus.UN);
		Notification read = buildNotification();
		read.setUserId(11);
		read.setStatus(NotificationStatus.RD);
		Notification otherUser = buildNotification();
		otherUser.setUserId(22);
		otherUser.setStatus(NotificationStatus.UN);
		notificationRepository.save(unreadA);
		notificationRepository.save(unreadB);
		notificationRepository.save(read);
		notificationRepository.save(otherUser);

		assertThat(notificationRepository.countByUserIdAndStatus(11, NotificationStatus.UN)).isEqualTo(2L);
	}

	@Test
	void countByUserIdAndStatusReturnsZeroWhenNoneMatch() {
		assertThat(notificationRepository.countByUserIdAndStatus(11, NotificationStatus.UN)).isZero();
	}

	@ParameterizedTest
	@EnumSource(NotificationCategory.class)
	void savePersistsVariousCategories(NotificationCategory category) {
		Notification notification = buildNotification();
		notification.setCategory(category);

		Notification saved = notificationRepository.save(notification);

		assertThat(notificationRepository.findById(saved.getNotificationId()).orElseThrow().getCategory())
				.isEqualTo(category);
	}

	@ParameterizedTest
	@EnumSource(NotificationStatus.class)
	void savePersistsVariousStatuses(NotificationStatus status) {
		Notification notification = buildNotification();
		notification.setStatus(status);

		Notification saved = notificationRepository.save(notification);

		assertThat(notificationRepository.findById(saved.getNotificationId()).orElseThrow().getStatus())
				.isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 100, 5000, 999999, 2147483647})
	void savePersistsVariousUserIds(int userId) {
		Notification notification = buildNotification();
		notification.setUserId(userId);

		Notification saved = notificationRepository.save(notification);

		assertThat(notificationRepository.findById(saved.getNotificationId()).orElseThrow().getUserId())
				.isEqualTo(userId);
	}

	@ParameterizedTest
	@ValueSource(strings = {"Short", "A much longer notification message describing crop advisory in detail",
			"Special chars !@#$%^&*()", "Multi word reminder text", "12345 numeric message"})
	void savePersistsVariousMessages(String message) {
		Notification notification = buildNotification();
		notification.setMessage(message);

		Notification saved = notificationRepository.save(notification);

		assertThat(notificationRepository.findById(saved.getNotificationId()).orElseThrow().getMessage())
				.isEqualTo(message);
	}

	@ParameterizedTest
	@NullAndEmptySource
	void savePersistsNullOrEmptyMessage(String message) {
		Notification notification = buildNotification();
		notification.setMessage(message);

		Notification saved = notificationRepository.save(notification);

		assertThat(notificationRepository.findById(saved.getNotificationId()).orElseThrow().getMessage())
				.isEqualTo(message);
	}

	@ParameterizedTest
	@NullSource
	void savePersistsNullUserId(Integer userId) {
		Notification notification = buildNotification();
		notification.setUserId(userId);

		Notification saved = notificationRepository.save(notification);

		assertThat(notificationRepository.findById(saved.getNotificationId()).orElseThrow().getUserId())
				.isNull();
	}

	@ParameterizedTest
	@NullSource
	void savePersistsNullCreatedDate(LocalDate createdDate) {
		Notification notification = buildNotification();
		notification.setCreatedDate(createdDate);

		Notification saved = notificationRepository.save(notification);

		assertThat(notificationRepository.findById(saved.getNotificationId()).orElseThrow().getCreatedDate())
				.isNull();
	}

	@ParameterizedTest
	@MethodSource("dateArguments")
	void savePersistsVariousDates(LocalDate createdDate) {
		Notification notification = buildNotification();
		notification.setCreatedDate(createdDate);

		Notification saved = notificationRepository.save(notification);

		assertThat(notificationRepository.findById(saved.getNotificationId()).orElseThrow().getCreatedDate())
				.isEqualTo(createdDate);
	}

	@ParameterizedTest
	@MethodSource("notificationFields")
	void savePersistsFullFieldCombinations(String message, NotificationCategory category, NotificationStatus status) {
		Notification notification = Notification.builder()
				.userId(7)
				.message(message)
				.category(category)
				.status(status)
				.createdDate(LocalDate.of(2026, 6, 15))
				.build();

		Notification saved = notificationRepository.save(notification);

		Notification found = notificationRepository.findById(saved.getNotificationId()).orElseThrow();
		assertThat(found.getMessage()).isEqualTo(message);
		assertThat(found.getCategory()).isEqualTo(category);
		assertThat(found.getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@CsvSource({
			"1, CropAdvisory, UN",
			"2, Subsidy, RD",
			"3, InputProcurement, UN",
			"4, ProduceSale, UN",
			"5, Compliance, RD",
			"6, CropAdvisory, UN"
	})
	void savePersistsCsvCombinations(Integer userId, NotificationCategory category, NotificationStatus status) {
		Notification notification = buildNotification();
		notification.setUserId(userId);
		notification.setCategory(category);
		notification.setStatus(status);

		Notification saved = notificationRepository.save(notification);

		Notification found = notificationRepository.findById(saved.getNotificationId()).orElseThrow();
		assertThat(found.getUserId()).isEqualTo(userId);
		assertThat(found.getCategory()).isEqualTo(category);
		assertThat(found.getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 3, 4, 5})
	void saveMultipleAndCountMatches(int total) {
		for (int i = 0; i < total; i++) {
			notificationRepository.save(buildNotification());
		}

		assertThat(notificationRepository.count()).isEqualTo(total);
	}
}

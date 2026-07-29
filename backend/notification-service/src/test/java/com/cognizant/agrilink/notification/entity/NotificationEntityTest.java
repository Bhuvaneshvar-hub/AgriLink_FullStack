package com.cognizant.agrilink.notification.entity;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.notification.enums.NotificationStatus;
import java.time.LocalDate;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class NotificationEntityTest {

	private static Stream<Arguments> records() {
		return Stream.of(
				Arguments.of(1, 11, "Sowing window opens", "CropAdvisory", NotificationStatus.UN, LocalDate.of(2026, 1, 1)),
				Arguments.of(2, 22, "Subsidy approved", "Subsidy", NotificationStatus.RD, LocalDate.of(2025, 12, 31)),
				Arguments.of(3, 33, "Seed order placed", "InputProcurement", NotificationStatus.UN, LocalDate.of(2024, 2, 29)),
				Arguments.of(4, 44, "Produce listed", "ProduceSale", NotificationStatus.UN, LocalDate.of(2030, 6, 15)),
				Arguments.of(5, 55, "Compliance due", "Compliance", NotificationStatus.RD, LocalDate.of(2000, 2, 29)),
				Arguments.of(6, 66, "Weather warning", "WeatherAlert", NotificationStatus.UN, LocalDate.of(2099, 7, 4)));
	}

	@Test
	void noArgsConstructorCreatesInstance() {
		Notification notification = new Notification();

		assertThat(notification).isNotNull();
		assertThat(notification.getNotificationId()).isNull();
	}

	@Test
	void allArgsConstructorSetsAllFields() {
		Notification notification = new Notification(1, 11, "msg", "CropAdvisory", NotificationStatus.UN,
				LocalDate.of(2026, 6, 15));

		assertThat(notification.getNotificationId()).isEqualTo(1);
		assertThat(notification.getUserId()).isEqualTo(11);
		assertThat(notification.getMessage()).isEqualTo("msg");
		assertThat(notification.getCategory()).isEqualTo("CropAdvisory");
		assertThat(notification.getStatus()).isEqualTo(NotificationStatus.UN);
		assertThat(notification.getCreatedDate()).isEqualTo(LocalDate.of(2026, 6, 15));
	}

	@Test
	void builderSetsAllFields() {
		Notification notification = Notification.builder()
				.notificationId(9)
				.userId(99)
				.message("Built")
				.category("Subsidy")
				.status(NotificationStatus.RD)
				.createdDate(LocalDate.of(2027, 3, 10))
				.build();

		assertThat(notification.getNotificationId()).isEqualTo(9);
		assertThat(notification.getUserId()).isEqualTo(99);
		assertThat(notification.getMessage()).isEqualTo("Built");
		assertThat(notification.getCategory()).isEqualTo("Subsidy");
		assertThat(notification.getStatus()).isEqualTo(NotificationStatus.RD);
		assertThat(notification.getCreatedDate()).isEqualTo(LocalDate.of(2027, 3, 10));
	}

	@Test
	void equalsAndHashCodeMatchForSameValues() {
		Notification a = new Notification(1, 11, "msg", "CropAdvisory", NotificationStatus.UN, LocalDate.of(2026, 6, 15));
		Notification b = new Notification(1, 11, "msg", "CropAdvisory", NotificationStatus.UN, LocalDate.of(2026, 6, 15));

		assertThat(a).isEqualTo(b);
		assertThat(a.hashCode()).isEqualTo(b.hashCode());
	}

	@Test
	void equalsReturnsFalseForDifferentValues() {
		Notification a = new Notification(1, 11, "msg", "CropAdvisory", NotificationStatus.UN, LocalDate.of(2026, 6, 15));
		Notification b = new Notification(2, 22, "other", "Subsidy", NotificationStatus.RD, LocalDate.of(2025, 1, 1));

		assertThat(a).isNotEqualTo(b);
	}

	@Test
	void toStringContainsFieldValues() {
		Notification notification = new Notification(1, 11, "Sowing", "CropAdvisory", NotificationStatus.UN,
				LocalDate.of(2026, 6, 15));

		String result = notification.toString();

		assertThat(result).contains("Sowing", "CropAdvisory", "UN");
	}

	@ParameterizedTest
	@MethodSource("records")
	void settersAndGettersWorkForAllFields(Integer id, Integer userId, String message, String category,
			NotificationStatus status, LocalDate createdDate) {
		Notification notification = new Notification();

		notification.setNotificationId(id);
		notification.setUserId(userId);
		notification.setMessage(message);
		notification.setCategory(category);
		notification.setStatus(status);
		notification.setCreatedDate(createdDate);

		assertThat(notification.getNotificationId()).isEqualTo(id);
		assertThat(notification.getUserId()).isEqualTo(userId);
		assertThat(notification.getMessage()).isEqualTo(message);
		assertThat(notification.getCategory()).isEqualTo(category);
		assertThat(notification.getStatus()).isEqualTo(status);
		assertThat(notification.getCreatedDate()).isEqualTo(createdDate);
	}

	@ParameterizedTest
	@MethodSource("records")
	void builderMatchesAllArgsConstructor(Integer id, Integer userId, String message, String category,
			NotificationStatus status, LocalDate createdDate) {
		Notification built = Notification.builder()
				.notificationId(id)
				.userId(userId)
				.message(message)
				.category(category)
				.status(status)
				.createdDate(createdDate)
				.build();
		Notification constructed = new Notification(id, userId, message, category, status, createdDate);

		assertThat(built).isEqualTo(constructed);
		assertThat(built.hashCode()).isEqualTo(constructed.hashCode());
	}

	@ParameterizedTest
	@ValueSource(strings = {"CropAdvisory", "Subsidy", "InputProcurement", "ProduceSale", "Compliance",
			"WeatherAlert", "MarketPrice", "PestWarning"})
	void categorySetterAcceptsVariousValues(String category) {
		Notification notification = new Notification();

		notification.setCategory(category);

		assertThat(notification.getCategory()).isEqualTo(category);
	}

	@ParameterizedTest
	@EnumSource(NotificationStatus.class)
	void statusSetterAcceptsVariousValues(NotificationStatus status) {
		Notification notification = new Notification();

		notification.setStatus(status);

		assertThat(notification.getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 0, -1, 100, 5000, 999999, 2147483647})
	void userIdSetterAcceptsBoundaryValues(int userId) {
		Notification notification = new Notification();

		notification.setUserId(userId);

		assertThat(notification.getUserId()).isEqualTo(userId);
	}

	@ParameterizedTest
	@NullAndEmptySource
	void messageSetterAcceptsNullOrEmpty(String message) {
		Notification notification = new Notification();

		notification.setMessage(message);

		assertThat(notification.getMessage()).isEqualTo(message);
	}
}

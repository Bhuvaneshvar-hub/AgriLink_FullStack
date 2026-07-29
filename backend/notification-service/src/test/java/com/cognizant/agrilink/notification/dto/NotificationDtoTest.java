package com.cognizant.agrilink.notification.dto;

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

class NotificationDtoTest {

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
		NotificationDto dto = new NotificationDto();

		assertThat(dto).isNotNull();
		assertThat(dto.getMessage()).isNull();
	}

	@Test
	void allArgsConstructorSetsAllFields() {
		NotificationDto dto = new NotificationDto(1, 11, "msg", "CropAdvisory", NotificationStatus.UN,
				LocalDate.of(2026, 6, 15));

		assertThat(dto.getNotificationId()).isEqualTo(1);
		assertThat(dto.getUserId()).isEqualTo(11);
		assertThat(dto.getMessage()).isEqualTo("msg");
		assertThat(dto.getCategory()).isEqualTo("CropAdvisory");
		assertThat(dto.getStatus()).isEqualTo(NotificationStatus.UN);
		assertThat(dto.getCreatedDate()).isEqualTo(LocalDate.of(2026, 6, 15));
	}

	@Test
	void builderSetsAllFields() {
		NotificationDto dto = NotificationDto.builder()
				.notificationId(9)
				.userId(99)
				.message("Built")
				.category("Subsidy")
				.status(NotificationStatus.RD)
				.createdDate(LocalDate.of(2027, 3, 10))
				.build();

		assertThat(dto.getNotificationId()).isEqualTo(9);
		assertThat(dto.getUserId()).isEqualTo(99);
		assertThat(dto.getMessage()).isEqualTo("Built");
		assertThat(dto.getCategory()).isEqualTo("Subsidy");
		assertThat(dto.getStatus()).isEqualTo(NotificationStatus.RD);
		assertThat(dto.getCreatedDate()).isEqualTo(LocalDate.of(2027, 3, 10));
	}

	@Test
	void equalsAndHashCodeMatchForSameValues() {
		NotificationDto a = new NotificationDto(1, 11, "msg", "CropAdvisory", NotificationStatus.UN, LocalDate.of(2026, 6, 15));
		NotificationDto b = new NotificationDto(1, 11, "msg", "CropAdvisory", NotificationStatus.UN, LocalDate.of(2026, 6, 15));

		assertThat(a).isEqualTo(b);
		assertThat(a.hashCode()).isEqualTo(b.hashCode());
	}

	@Test
	void equalsReturnsFalseForDifferentValues() {
		NotificationDto a = new NotificationDto(1, 11, "msg", "CropAdvisory", NotificationStatus.UN, LocalDate.of(2026, 6, 15));
		NotificationDto b = new NotificationDto(2, 22, "other", "Subsidy", NotificationStatus.RD, LocalDate.of(2025, 1, 1));

		assertThat(a).isNotEqualTo(b);
	}

	@Test
	void toStringContainsFieldValues() {
		NotificationDto dto = new NotificationDto(1, 11, "Sowing", "CropAdvisory", NotificationStatus.UN,
				LocalDate.of(2026, 6, 15));

		String result = dto.toString();

		assertThat(result).contains("Sowing", "CropAdvisory", "UN");
	}

	@ParameterizedTest
	@MethodSource("records")
	void settersAndGettersWorkForAllFields(Integer id, Integer userId, String message, String category,
			NotificationStatus status, LocalDate createdDate) {
		NotificationDto dto = new NotificationDto();

		dto.setNotificationId(id);
		dto.setUserId(userId);
		dto.setMessage(message);
		dto.setCategory(category);
		dto.setStatus(status);
		dto.setCreatedDate(createdDate);

		assertThat(dto.getNotificationId()).isEqualTo(id);
		assertThat(dto.getUserId()).isEqualTo(userId);
		assertThat(dto.getMessage()).isEqualTo(message);
		assertThat(dto.getCategory()).isEqualTo(category);
		assertThat(dto.getStatus()).isEqualTo(status);
		assertThat(dto.getCreatedDate()).isEqualTo(createdDate);
	}

	@ParameterizedTest
	@MethodSource("records")
	void builderMatchesAllArgsConstructor(Integer id, Integer userId, String message, String category,
			NotificationStatus status, LocalDate createdDate) {
		NotificationDto built = NotificationDto.builder()
				.notificationId(id)
				.userId(userId)
				.message(message)
				.category(category)
				.status(status)
				.createdDate(createdDate)
				.build();
		NotificationDto constructed = new NotificationDto(id, userId, message, category, status, createdDate);

		assertThat(built).isEqualTo(constructed);
		assertThat(built.hashCode()).isEqualTo(constructed.hashCode());
	}

	@ParameterizedTest
	@ValueSource(strings = {"CropAdvisory", "Subsidy", "InputProcurement", "ProduceSale", "Compliance",
			"WeatherAlert", "MarketPrice", "PestWarning"})
	void categorySetterAcceptsVariousValues(String category) {
		NotificationDto dto = new NotificationDto();

		dto.setCategory(category);

		assertThat(dto.getCategory()).isEqualTo(category);
	}

	@ParameterizedTest
	@EnumSource(NotificationStatus.class)
	void statusSetterAcceptsVariousValues(NotificationStatus status) {
		NotificationDto dto = new NotificationDto();

		dto.setStatus(status);

		assertThat(dto.getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 0, -1, 100, 5000, 999999, 2147483647})
	void userIdSetterAcceptsBoundaryValues(int userId) {
		NotificationDto dto = new NotificationDto();

		dto.setUserId(userId);

		assertThat(dto.getUserId()).isEqualTo(userId);
	}

	@ParameterizedTest
	@NullAndEmptySource
	void messageSetterAcceptsNullOrEmpty(String message) {
		NotificationDto dto = new NotificationDto();

		dto.setMessage(message);

		assertThat(dto.getMessage()).isEqualTo(message);
	}
}

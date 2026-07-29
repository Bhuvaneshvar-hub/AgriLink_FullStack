package com.cognizant.agrilink.notification.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.notification.dto.NotificationDto;
import com.cognizant.agrilink.notification.entity.Notification;
import com.cognizant.agrilink.notification.enums.NotificationStatus;
import com.cognizant.agrilink.notification.repository.NotificationRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NotificationServiceExtendedTest {

	@Mock
	private NotificationRepository notificationRepository;

	@InjectMocks
	private NotificationService notificationService;

	private Notification buildNotification() {
		return Notification.builder()
				.notificationId(1)
				.userId(1)
				.message("Sowing reminder")
				.category("CropAdvisory")
				.status(NotificationStatus.UN)
				.createdDate(LocalDate.of(2026, 6, 15))
				.build();
	}

	private NotificationDto buildDto() {
		return NotificationDto.builder()
				.userId(1)
				.message("Sowing reminder")
				.category("CropAdvisory")
				.status(NotificationStatus.UN)
				.createdDate(LocalDate.of(2026, 6, 15))
				.build();
	}

	private static Stream<Arguments> dtoFields() {
		return Stream.of(
				Arguments.of(10, "Sowing window opens", "CropAdvisory", NotificationStatus.UN, LocalDate.of(2026, 1, 1)),
				Arguments.of(20, "Subsidy approved", "Subsidy", NotificationStatus.RD, LocalDate.of(2025, 12, 31)),
				Arguments.of(30, "Seed order placed", "InputProcurement", NotificationStatus.UN, LocalDate.of(2024, 2, 29)),
				Arguments.of(40, "Produce listed", "ProduceSale", NotificationStatus.UN, LocalDate.of(2030, 6, 15)),
				Arguments.of(50, "Compliance due", "Compliance", NotificationStatus.RD, LocalDate.of(2000, 2, 29)),
				Arguments.of(60, "Weather warning", "WeatherAlert", NotificationStatus.UN, LocalDate.of(2099, 7, 4)));
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
	void getAllReturnsEmptyList() {
		when(notificationRepository.findAll()).thenReturn(new ArrayList<>());

		assertThat(notificationService.getAll()).isEmpty();
		verify(notificationRepository).findAll();
	}

	@Test
	void getAllReturnsManyRecords() {
		when(notificationRepository.findAll())
				.thenReturn(List.of(buildNotification(), buildNotification(), buildNotification()));

		assertThat(notificationService.getAll()).hasSize(3);
		verify(notificationRepository).findAll();
	}

	@Test
	void getByIdReturnsRecord() {
		when(notificationRepository.findById(1)).thenReturn(Optional.of(buildNotification()));

		Notification result = notificationService.getById(1);

		assertThat(result.getMessage()).isEqualTo("Sowing reminder");
		verify(notificationRepository).findById(1);
	}

	@Test
	void getByIdThrowsWithMessageWhenMissing() {
		when(notificationRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> notificationService.getById(99))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("Notification not found with id 99");
	}

	@Test
	void createSavesAndReturnsRecord() {
		Notification saved = buildNotification();
		when(notificationRepository.save(any(Notification.class))).thenReturn(saved);

		Notification result = notificationService.create(buildDto());

		assertThat(result).isEqualTo(saved);
		verify(notificationRepository).save(any(Notification.class));
	}

	@Test
	void createMapsDtoToEntity() {
		when(notificationRepository.save(any(Notification.class))).thenReturn(buildNotification());
		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

		notificationService.create(buildDto());

		verify(notificationRepository).save(captor.capture());
		Notification captured = captor.getValue();
		assertThat(captured.getUserId()).isEqualTo(1);
		assertThat(captured.getMessage()).isEqualTo("Sowing reminder");
		assertThat(captured.getCategory()).isEqualTo("CropAdvisory");
		assertThat(captured.getStatus()).isEqualTo(NotificationStatus.UN);
		assertThat(captured.getCreatedDate()).isEqualTo(LocalDate.of(2026, 6, 15));
	}

	@Test
	void createDoesNotSetIdFromDto() {
		when(notificationRepository.save(any(Notification.class))).thenReturn(buildNotification());
		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

		notificationService.create(buildDto());

		verify(notificationRepository).save(captor.capture());
		assertThat(captor.getValue().getNotificationId()).isNull();
	}

	@Test
	void updateFindsModifiesAndSaves() {
		Notification existing = buildNotification();
		when(notificationRepository.findById(1)).thenReturn(Optional.of(existing));
		when(notificationRepository.save(any(Notification.class))).thenReturn(existing);

		notificationService.update(1, buildDto());

		verify(notificationRepository).findById(1);
		verify(notificationRepository).save(existing);
	}

	@Test
	void updateMapsAllFieldsFromDto() {
		Notification existing = buildNotification();
		when(notificationRepository.findById(1)).thenReturn(Optional.of(existing));
		when(notificationRepository.save(any(Notification.class))).thenReturn(existing);
		NotificationDto dto = NotificationDto.builder()
				.userId(55)
				.message("Updated message")
				.category("Subsidy")
				.status(NotificationStatus.RD)
				.createdDate(LocalDate.of(2027, 3, 10))
				.build();
		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

		notificationService.update(1, dto);

		verify(notificationRepository).save(captor.capture());
		Notification captured = captor.getValue();
		assertThat(captured.getUserId()).isEqualTo(55);
		assertThat(captured.getMessage()).isEqualTo("Updated message");
		assertThat(captured.getCategory()).isEqualTo("Subsidy");
		assertThat(captured.getStatus()).isEqualTo(NotificationStatus.RD);
		assertThat(captured.getCreatedDate()).isEqualTo(LocalDate.of(2027, 3, 10));
	}

	@Test
	void updateThrowsWhenMissingAndNeverSaves() {
		when(notificationRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> notificationService.update(99, buildDto()))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("Notification not found with id 99");
		verify(notificationRepository, never()).save(any(Notification.class));
	}

	@Test
	void deleteFindsAndRemoves() {
		Notification existing = buildNotification();
		when(notificationRepository.findById(1)).thenReturn(Optional.of(existing));

		notificationService.delete(1);

		verify(notificationRepository).findById(1);
		verify(notificationRepository, times(1)).delete(existing);
	}

	@Test
	void deleteThrowsWhenMissingAndNeverDeletes() {
		when(notificationRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> notificationService.delete(99))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("Notification not found with id 99");
		verify(notificationRepository, never()).delete(any(Notification.class));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 3, 5, 10, 50, 100})
	void getAllReturnsExpectedSize(int size) {
		List<Notification> list = new ArrayList<>();
		for (int i = 0; i < size; i++) {
			list.add(buildNotification());
		}
		when(notificationRepository.findAll()).thenReturn(list);

		assertThat(notificationService.getAll()).hasSize(size);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 100, 5000, 999999, 2147483647})
	void getByIdQueriesRepositoryWithGivenId(int id) {
		when(notificationRepository.findById(id)).thenReturn(Optional.of(buildNotification()));

		notificationService.getById(id);

		verify(notificationRepository).findById(id);
	}

	@ParameterizedTest
	@ValueSource(ints = {99, 100, 12345, 0, 2147483647})
	void getByIdThrowsWithIdInMessage(int id) {
		when(notificationRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> notificationService.getById(id))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("Notification not found with id " + id);
	}

	@ParameterizedTest
	@ValueSource(strings = {"CropAdvisory", "Subsidy", "InputProcurement", "ProduceSale", "Compliance",
			"WeatherAlert", "MarketPrice", "PestWarning"})
	void createMapsVariousCategories(String category) {
		when(notificationRepository.save(any(Notification.class))).thenReturn(buildNotification());
		NotificationDto dto = buildDto();
		dto.setCategory(category);
		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

		notificationService.create(dto);

		verify(notificationRepository).save(captor.capture());
		assertThat(captor.getValue().getCategory()).isEqualTo(category);
	}

	@ParameterizedTest
	@EnumSource(NotificationStatus.class)
	void createMapsVariousStatuses(NotificationStatus status) {
		when(notificationRepository.save(any(Notification.class))).thenReturn(buildNotification());
		NotificationDto dto = buildDto();
		dto.setStatus(status);
		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

		notificationService.create(dto);

		verify(notificationRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(strings = {"Short reminder", "A longer descriptive notification message about crops",
			"Special !@#$ chars", "Numeric 12345 message", "Mixed Case Words Here"})
	void createMapsVariousMessages(String message) {
		when(notificationRepository.save(any(Notification.class))).thenReturn(buildNotification());
		NotificationDto dto = buildDto();
		dto.setMessage(message);
		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

		notificationService.create(dto);

		verify(notificationRepository).save(captor.capture());
		assertThat(captor.getValue().getMessage()).isEqualTo(message);
	}

	@ParameterizedTest
	@NullAndEmptySource
	void createMapsNullOrEmptyMessage(String message) {
		when(notificationRepository.save(any(Notification.class))).thenReturn(buildNotification());
		NotificationDto dto = buildDto();
		dto.setMessage(message);
		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

		notificationService.create(dto);

		verify(notificationRepository).save(captor.capture());
		assertThat(captor.getValue().getMessage()).isEqualTo(message);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 0, 100, 5000, 999999, 2147483647})
	void createMapsVariousUserIds(int userId) {
		when(notificationRepository.save(any(Notification.class))).thenReturn(buildNotification());
		NotificationDto dto = buildDto();
		dto.setUserId(userId);
		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

		notificationService.create(dto);

		verify(notificationRepository).save(captor.capture());
		assertThat(captor.getValue().getUserId()).isEqualTo(userId);
	}

	@ParameterizedTest
	@NullSource
	void createMapsNullUserId(Integer userId) {
		when(notificationRepository.save(any(Notification.class))).thenReturn(buildNotification());
		NotificationDto dto = buildDto();
		dto.setUserId(userId);
		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

		notificationService.create(dto);

		verify(notificationRepository).save(captor.capture());
		assertThat(captor.getValue().getUserId()).isNull();
	}

	@ParameterizedTest
	@MethodSource("dateArguments")
	void createMapsVariousDates(LocalDate createdDate) {
		when(notificationRepository.save(any(Notification.class))).thenReturn(buildNotification());
		NotificationDto dto = buildDto();
		dto.setCreatedDate(createdDate);
		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

		notificationService.create(dto);

		verify(notificationRepository).save(captor.capture());
		assertThat(captor.getValue().getCreatedDate()).isEqualTo(createdDate);
	}

	@ParameterizedTest
	@NullSource
	void createMapsNullCreatedDate(LocalDate createdDate) {
		when(notificationRepository.save(any(Notification.class))).thenReturn(buildNotification());
		NotificationDto dto = buildDto();
		dto.setCreatedDate(createdDate);
		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

		notificationService.create(dto);

		verify(notificationRepository).save(captor.capture());
		assertThat(captor.getValue().getCreatedDate()).isNull();
	}

	@ParameterizedTest
	@MethodSource("dtoFields")
	void createMapsAllFieldCombinations(Integer userId, String message, String category, NotificationStatus status,
			LocalDate createdDate) {
		when(notificationRepository.save(any(Notification.class))).thenReturn(buildNotification());
		NotificationDto dto = NotificationDto.builder()
				.userId(userId)
				.message(message)
				.category(category)
				.status(status)
				.createdDate(createdDate)
				.build();
		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

		notificationService.create(dto);

		verify(notificationRepository).save(captor.capture());
		Notification captured = captor.getValue();
		assertThat(captured.getUserId()).isEqualTo(userId);
		assertThat(captured.getMessage()).isEqualTo(message);
		assertThat(captured.getCategory()).isEqualTo(category);
		assertThat(captured.getStatus()).isEqualTo(status);
		assertThat(captured.getCreatedDate()).isEqualTo(createdDate);
	}

	@ParameterizedTest
	@MethodSource("dtoFields")
	void updateMapsAllFieldCombinations(Integer userId, String message, String category, NotificationStatus status,
			LocalDate createdDate) {
		Notification existing = buildNotification();
		when(notificationRepository.findById(1)).thenReturn(Optional.of(existing));
		when(notificationRepository.save(any(Notification.class))).thenReturn(existing);
		NotificationDto dto = NotificationDto.builder()
				.userId(userId)
				.message(message)
				.category(category)
				.status(status)
				.createdDate(createdDate)
				.build();
		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

		notificationService.update(1, dto);

		verify(notificationRepository).save(captor.capture());
		Notification captured = captor.getValue();
		assertThat(captured.getUserId()).isEqualTo(userId);
		assertThat(captured.getMessage()).isEqualTo(message);
		assertThat(captured.getCategory()).isEqualTo(category);
		assertThat(captured.getStatus()).isEqualTo(status);
		assertThat(captured.getCreatedDate()).isEqualTo(createdDate);
	}

	@ParameterizedTest
	@CsvSource({
			"1, CropAdvisory, UN",
			"2, Subsidy, RD",
			"3, InputProcurement, UN",
			"4, ProduceSale, UN",
			"5, Compliance, RD",
			"6, WeatherAlert, UN"
	})
	void updateMapsCsvCombinations(Integer userId, String category, NotificationStatus status) {
		Notification existing = buildNotification();
		when(notificationRepository.findById(1)).thenReturn(Optional.of(existing));
		when(notificationRepository.save(any(Notification.class))).thenReturn(existing);
		NotificationDto dto = buildDto();
		dto.setUserId(userId);
		dto.setCategory(category);
		dto.setStatus(status);
		ArgumentCaptor<Notification> captor = ArgumentCaptor.forClass(Notification.class);

		notificationService.update(1, dto);

		verify(notificationRepository).save(captor.capture());
		Notification captured = captor.getValue();
		assertThat(captured.getUserId()).isEqualTo(userId);
		assertThat(captured.getCategory()).isEqualTo(category);
		assertThat(captured.getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 100, 5000, 999999})
	void deleteQueriesAndDeletesById(int id) {
		Notification existing = buildNotification();
		when(notificationRepository.findById(id)).thenReturn(Optional.of(existing));

		notificationService.delete(id);

		verify(notificationRepository).findById(id);
		verify(notificationRepository).delete(existing);
	}

	@ParameterizedTest
	@ValueSource(ints = {99, 100, 12345, 0})
	void deleteThrowsAndNeverDeletesWhenMissing(int id) {
		when(notificationRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> notificationService.delete(id))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("Notification not found with id " + id);
		verify(notificationRepository, never()).delete(any(Notification.class));
	}
}

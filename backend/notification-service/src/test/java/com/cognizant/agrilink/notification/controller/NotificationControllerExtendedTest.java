package com.cognizant.agrilink.notification.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cognizant.agrilink.notification.dto.NotificationDto;
import com.cognizant.agrilink.notification.entity.Notification;
import com.cognizant.agrilink.notification.enums.NotificationCategory;
import com.cognizant.agrilink.notification.enums.NotificationStatus;
import com.cognizant.agrilink.notification.service.NotificationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class NotificationControllerExtendedTest {

	@Mock
	private NotificationService notificationService;

	@InjectMocks
	private NotificationController notificationController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(notificationController).build();
	}

	private Notification build(Integer id, Integer userId, String message, NotificationCategory category, NotificationStatus status,
			LocalDate createdDate) {
		return Notification.builder()
				.notificationId(id)
				.userId(userId)
				.message(message)
				.category(category)
				.status(status)
				.createdDate(createdDate)
				.build();
	}

	private static Stream<Arguments> records() {
		return Stream.of(
				Arguments.of(1, 11, "Sowing window opens", NotificationCategory.CropAdvisory, NotificationStatus.UN, "2026-01-01"),
				Arguments.of(2, 22, "Subsidy approved", NotificationCategory.Subsidy, NotificationStatus.RD, "2025-12-31"),
				Arguments.of(3, 33, "Seed order placed", NotificationCategory.InputProcurement, NotificationStatus.UN, "2024-02-29"),
				Arguments.of(4, 44, "Produce listed", NotificationCategory.ProduceSale, NotificationStatus.UN, "2030-06-15"),
				Arguments.of(5, 55, "Compliance due", NotificationCategory.Compliance, NotificationStatus.RD, "2000-02-29"),
				Arguments.of(6, 66, "Weather warning", NotificationCategory.CropAdvisory, NotificationStatus.UN, "2099-07-04"));
	}

	@Test
	void getAllReturnsEmptyList() throws Exception {
		when(notificationService.getAll()).thenReturn(new ArrayList<>());

		mockMvc.perform(get("/notifications"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isArray())
				.andExpect(jsonPath("$.length()").value(0));
		verify(notificationService).getAll();
	}

	@Test
	void getAllReturnsFullDataForSingleRecord() throws Exception {
		Notification n = build(1, 11, "Sowing reminder", NotificationCategory.CropAdvisory, NotificationStatus.UN, LocalDate.of(2026, 6, 15));
		when(notificationService.getAll()).thenReturn(List.of(n));

		mockMvc.perform(get("/notifications"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].notificationId").value(1))
				.andExpect(jsonPath("$[0].userId").value(11))
				.andExpect(jsonPath("$[0].message").value("Sowing reminder"))
				.andExpect(jsonPath("$[0].category").value("CropAdvisory"))
				.andExpect(jsonPath("$[0].status").value("UN"))
				.andExpect(jsonPath("$[0].createdDate").value("2026-06-15"));
		verify(notificationService).getAll();
	}

	@ParameterizedTest
	@ValueSource(ints = {0, 1, 2, 3, 5, 10, 25, 100})
	void getAllReturnsExpectedListSize(int size) throws Exception {
		List<Notification> list = new ArrayList<>();
		for (int i = 0; i < size; i++) {
			list.add(build(i + 1, i, "msg" + i, NotificationCategory.CropAdvisory, NotificationStatus.UN, LocalDate.of(2026, 6, 15)));
		}
		when(notificationService.getAll()).thenReturn(list);

		mockMvc.perform(get("/notifications"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(size));
		verify(notificationService).getAll();
	}

	@ParameterizedTest
	@MethodSource("records")
	void getByIdReturnsFullData(Integer id, Integer userId, String message, NotificationCategory category, NotificationStatus status,
			String createdDate) throws Exception {
		Notification n = build(id, userId, message, category, status, LocalDate.parse(createdDate));
		when(notificationService.getById(id)).thenReturn(n);

		mockMvc.perform(get("/notifications/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notificationId").value(id))
				.andExpect(jsonPath("$.userId").value(userId))
				.andExpect(jsonPath("$.message").value(message))
				.andExpect(jsonPath("$.category").value(category.name()))
				.andExpect(jsonPath("$.status").value(status.name()))
				.andExpect(jsonPath("$.createdDate").value(createdDate));
		verify(notificationService).getById(id);
	}

	@ParameterizedTest
	@MethodSource("records")
	void getAllReturnsFullDataParameterized(Integer id, Integer userId, String message, NotificationCategory category,
			NotificationStatus status, String createdDate) throws Exception {
		Notification n = build(id, userId, message, category, status, LocalDate.parse(createdDate));
		when(notificationService.getAll()).thenReturn(List.of(n));

		mockMvc.perform(get("/notifications"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].notificationId").value(id))
				.andExpect(jsonPath("$[0].userId").value(userId))
				.andExpect(jsonPath("$[0].message").value(message))
				.andExpect(jsonPath("$[0].category").value(category.name()))
				.andExpect(jsonPath("$[0].status").value(status.name()))
				.andExpect(jsonPath("$[0].createdDate").value(createdDate));
		verify(notificationService).getAll();
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 100, 5000, 999999, 2147483647})
	void getByIdQueriesServiceWithGivenId(int id) throws Exception {
		Notification n = build(id, 1, "msg", NotificationCategory.CropAdvisory, NotificationStatus.UN, LocalDate.of(2026, 6, 15));
		when(notificationService.getById(id)).thenReturn(n);

		mockMvc.perform(get("/notifications/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.notificationId").value(id));
		verify(notificationService).getById(id);
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		Notification n = build(1, 1, "msg", NotificationCategory.CropAdvisory, NotificationStatus.UN, LocalDate.of(2026, 6, 15));
		when(notificationService.create(any(NotificationDto.class))).thenReturn(n);

		mockMvc.perform(post("/notifications")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new NotificationDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification created successfully"))
				.andExpect(jsonPath("$.notificationId").doesNotExist())
				.andExpect(jsonPath("$.userId").doesNotExist())
				.andExpect(jsonPath("$.category").doesNotExist())
				.andExpect(jsonPath("$.status").doesNotExist())
				.andExpect(jsonPath("$.createdDate").doesNotExist());
		verify(notificationService).create(any(NotificationDto.class));
	}

	@ParameterizedTest
	@MethodSource("records")
	void createReturnsMessageOnlyForVariousBodies(Integer id, Integer userId, String message, NotificationCategory category,
			NotificationStatus status, String createdDate) throws Exception {
		Notification n = build(id, userId, message, category, status, LocalDate.parse(createdDate));
		when(notificationService.create(any(NotificationDto.class))).thenReturn(n);
		NotificationDto dto = NotificationDto.builder()
				.userId(userId)
				.message(message)
				.category(category)
				.status(status)
				.build();

		mockMvc.perform(post("/notifications")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(dto)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification created successfully"))
				.andExpect(jsonPath("$.category").doesNotExist())
				.andExpect(jsonPath("$.status").doesNotExist())
				.andExpect(jsonPath("$.userId").doesNotExist());
		verify(notificationService).create(any(NotificationDto.class));
	}

	@ParameterizedTest
	@EnumSource(NotificationCategory.class)
	void createReturnsMessageOnlyForVariousCategories(NotificationCategory category) throws Exception {
		Notification n = build(1, 1, "msg", category, NotificationStatus.UN, LocalDate.of(2026, 6, 15));
		when(notificationService.create(any(NotificationDto.class))).thenReturn(n);
		NotificationDto dto = NotificationDto.builder().category(category).build();

		mockMvc.perform(post("/notifications")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(dto)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification created successfully"))
				.andExpect(jsonPath("$.category").doesNotExist());
		verify(notificationService).create(any(NotificationDto.class));
	}

	@ParameterizedTest
	@MethodSource("records")
	void updateReturnsMessageOnly(Integer id, Integer userId, String message, NotificationCategory category, NotificationStatus status,
			String createdDate) throws Exception {
		Notification n = build(id, userId, message, category, status, LocalDate.parse(createdDate));
		when(notificationService.update(eq(id), any(NotificationDto.class))).thenReturn(n);
		NotificationDto dto = NotificationDto.builder()
				.userId(userId)
				.message(message)
				.category(category)
				.status(status)
				.build();

		mockMvc.perform(put("/notifications/" + id)
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(dto)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification updated successfully"))
				.andExpect(jsonPath("$.notificationId").doesNotExist())
				.andExpect(jsonPath("$.category").doesNotExist())
				.andExpect(jsonPath("$.status").doesNotExist());
		verify(notificationService).update(eq(id), any(NotificationDto.class));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 100, 5000, 999999, 2147483647})
	void updateQueriesServiceWithGivenId(int id) throws Exception {
		Notification n = build(id, 1, "msg", NotificationCategory.CropAdvisory, NotificationStatus.RD, LocalDate.of(2026, 6, 15));
		when(notificationService.update(eq(id), any(NotificationDto.class))).thenReturn(n);

		mockMvc.perform(put("/notifications/" + id)
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new NotificationDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification updated successfully"))
				.andExpect(jsonPath("$.userId").doesNotExist());
		verify(notificationService).update(eq(id), any(NotificationDto.class));
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
	void updateReturnsMessageOnlyForCsvBodies(Integer id, NotificationCategory category, NotificationStatus status) throws Exception {
		Notification n = build(id, 1, "msg", category, status, LocalDate.of(2026, 6, 15));
		when(notificationService.update(eq(id), any(NotificationDto.class))).thenReturn(n);
		NotificationDto dto = NotificationDto.builder().category(category).status(status).build();

		mockMvc.perform(put("/notifications/" + id)
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(dto)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification updated successfully"))
				.andExpect(jsonPath("$.category").doesNotExist())
				.andExpect(jsonPath("$.status").doesNotExist());
		verify(notificationService).update(eq(id), any(NotificationDto.class));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/notifications/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification deleted successfully"))
				.andExpect(jsonPath("$.notificationId").doesNotExist())
				.andExpect(jsonPath("$.userId").doesNotExist())
				.andExpect(jsonPath("$.category").doesNotExist())
				.andExpect(jsonPath("$.status").doesNotExist())
				.andExpect(jsonPath("$.createdDate").doesNotExist());
		verify(notificationService).delete(1);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 100, 5000, 999999, 2147483647})
	void deleteReturnsMessageOnlyAndVerifiesId(int id) throws Exception {
		mockMvc.perform(delete("/notifications/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification deleted successfully"))
				.andExpect(jsonPath("$.category").doesNotExist());
		verify(notificationService).delete(id);
	}

	@ParameterizedTest
	@MethodSource("records")
	void createInvokesServiceForVariousRecords(Integer id, Integer userId, String message, NotificationCategory category,
			NotificationStatus status, String createdDate) throws Exception {
		Notification n = build(id, userId, message, category, status, LocalDate.parse(createdDate));
		when(notificationService.create(any(NotificationDto.class))).thenReturn(n);

		mockMvc.perform(post("/notifications")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new NotificationDto())))
				.andExpect(status().isOk());
		verify(notificationService).create(any(NotificationDto.class));
	}
}

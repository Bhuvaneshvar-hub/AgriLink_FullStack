package com.cognizant.agrilink.notification.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class NotificationControllerTest {

	@Mock
	private NotificationService notificationService;

	@InjectMocks
	private NotificationController notificationController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private Notification notification;

	private static Authentication caller(Integer userId) {
		return new UsernamePasswordAuthenticationToken(
				userId, null, List.of(new SimpleGrantedAuthority("ROLE_Farmer")));
	}

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(notificationController).build();
		notification = Notification.builder()
				.notificationId(1)
				.userId(1)
				.message("Sowing reminder")
				.category(NotificationCategory.CropAdvisory)
				.status(NotificationStatus.UN)
				.createdDate(LocalDate.of(2026, 6, 15))
				.build();
	}

	@Test
	void getAllReturnsData() throws Exception {
		when(notificationService.getByUserId(1)).thenReturn(List.of(notification));

		mockMvc.perform(get("/notifications").principal(caller(1)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].message").value("Sowing reminder"));
	}

	@Test
	void getByIdReturnsData() throws Exception {
		when(notificationService.getById(1)).thenReturn(notification);

		mockMvc.perform(get("/notifications/1").principal(caller(1)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.category").value("CropAdvisory"));
	}
	@Test
	void createReturnsMessageOnly() throws Exception {
		when(notificationService.create(any(NotificationDto.class))).thenReturn(notification);

		mockMvc.perform(post("/notifications")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new NotificationDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification created successfully"));
	}

	@Test
	void createSystemReturnsMessageOnly() throws Exception {
		when(notificationService.create(any(NotificationDto.class))).thenReturn(notification);

		mockMvc.perform(post("/notifications/system")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new NotificationDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification created"));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(notificationService.update(eq(1), any(NotificationDto.class))).thenReturn(notification);

		mockMvc.perform(put("/notifications/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new NotificationDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification updated successfully"));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/notifications/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification deleted successfully"));
	}
}

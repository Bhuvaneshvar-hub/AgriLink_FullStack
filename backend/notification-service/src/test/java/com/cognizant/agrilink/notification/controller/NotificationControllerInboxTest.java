package com.cognizant.agrilink.notification.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cognizant.agrilink.notification.entity.Notification;
import com.cognizant.agrilink.notification.enums.NotificationCategory;
import com.cognizant.agrilink.notification.enums.NotificationStatus;
import com.cognizant.agrilink.notification.service.NotificationService;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class NotificationControllerInboxTest {

	@Mock
	private NotificationService notificationService;

	@InjectMocks
	private NotificationController notificationController;

	private MockMvc mockMvc;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(notificationController).build();
	}

	private Notification notificationFor(Integer id, Integer userId) {
		return Notification.builder()
				.notificationId(id)
				.userId(userId)
				.message("Sowing reminder")
				.category(NotificationCategory.CropAdvisory)
				.status(NotificationStatus.UN)
				.createdDate(LocalDate.of(2026, 6, 15))
				.build();
	}

	private static org.springframework.security.core.Authentication farmer(Integer userId) {
		return new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
				userId, null,
				List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_Farmer")));
	}

	private static org.springframework.security.core.Authentication officer(Integer userId) {
		return new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
				userId, null,
				List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_Officer")));
	}

	private static void assertAccessDenied(Throwable thrown) {
		Throwable cause = thrown;
		while (cause != null && !(cause instanceof org.springframework.security.access.AccessDeniedException)) {
			cause = cause.getCause();
		}
		org.junit.jupiter.api.Assertions.assertInstanceOf(
				org.springframework.security.access.AccessDeniedException.class, cause,
				"expected an AccessDeniedException in the cause chain");
	}

	// ── GET /notifications/me ─────────────────────────────────────────────

	@Test
	void getMineReturnsCallersOwnInbox() throws Exception {
		when(notificationService.getByUserId(5))
				.thenReturn(List.of(notificationFor(1, 5), notificationFor(2, 5)));

		mockMvc.perform(get("/notifications/me").principal(farmer(5)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(2))
				.andExpect(jsonPath("$[0].userId").value(5));
		verify(notificationService).getByUserId(5);
		verify(notificationService, never()).getAll();
	}

	// ── GET /notifications/unread-count ───────────────────────────────────

	@Test
	void unreadCountReturnsCountForCaller() throws Exception {
		when(notificationService.unreadCount(5)).thenReturn(3L);

		mockMvc.perform(get("/notifications/unread-count").principal(farmer(5)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.unread").value(3));
		verify(notificationService).unreadCount(5);
	}

	// ── GET /notifications farmer scoping ─────────────────────────────────

	@Test
	void getAllForFarmerReturnsOnlyOwnNotifications() throws Exception {
		when(notificationService.getByUserId(5)).thenReturn(List.of(notificationFor(1, 5)));

		mockMvc.perform(get("/notifications").principal(farmer(5)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].userId").value(5));
		verify(notificationService).getByUserId(5);
		verify(notificationService, never()).getAll();
	}

	@Test
	void getAllForOfficerReturnsEverything() throws Exception {
		when(notificationService.getAll()).thenReturn(List.of(notificationFor(1, 5), notificationFor(2, 6)));

		mockMvc.perform(get("/notifications").principal(officer(9)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(2));
		verify(notificationService).getAll();
		verify(notificationService, never()).getByUserId(any());
	}

	// ── PUT /notifications/{id}/read | /unread | /dismiss ─────────────────

	@Test
	void markReadInvokesSetStatusRead() throws Exception {
		mockMvc.perform(put("/notifications/1/read").principal(officer(9)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification marked as read"));
		verify(notificationService).setStatus(1, NotificationStatus.RD);
	}

	@Test
	void markUnreadInvokesSetStatusUnread() throws Exception {
		mockMvc.perform(put("/notifications/1/unread").principal(officer(9)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification marked as unread"));
		verify(notificationService).setStatus(1, NotificationStatus.UN);
	}

	@Test
	void dismissInvokesSetStatusDismissed() throws Exception {
		mockMvc.perform(put("/notifications/1/dismiss").principal(officer(9)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification dismissed"));
		verify(notificationService).setStatus(1, NotificationStatus.DI);
	}

	@Test
	void farmerCanMarkOwnNotificationRead() throws Exception {
		when(notificationService.getById(1)).thenReturn(notificationFor(1, 5));

		mockMvc.perform(put("/notifications/1/read").principal(farmer(5)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Notification marked as read"));
		verify(notificationService).setStatus(1, NotificationStatus.RD);
	}

	@Test
	void farmerCannotMarkAnotherUsersNotification() {
		// notification belongs to userId 99; caller is farmer userId 5
		when(notificationService.getById(1)).thenReturn(notificationFor(1, 99));

		Throwable thrown = org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () ->
				mockMvc.perform(put("/notifications/1/dismiss").principal(farmer(5))));
		assertAccessDenied(thrown);
		verify(notificationService, never()).setStatus(any(), any());
	}

	@Test
	void farmerCannotViewAnotherUsersNotification() {
		when(notificationService.getById(1)).thenReturn(notificationFor(1, 99));

		Throwable thrown = org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () ->
				mockMvc.perform(get("/notifications/1").principal(farmer(5))));
		assertAccessDenied(thrown);
	}
}

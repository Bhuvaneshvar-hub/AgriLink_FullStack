package com.cognizant.agrilink.subsidy.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cognizant.agrilink.subsidy.dto.SubsidyApplicationDto;
import com.cognizant.agrilink.subsidy.entity.SubsidyApplication;
import com.cognizant.agrilink.subsidy.enums.ApplicationStatus;
import com.cognizant.agrilink.subsidy.service.SubsidyApplicationService;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class SubsidyApplicationControllerTest {

	@Mock
	private SubsidyApplicationService subsidyApplicationService;

	@InjectMocks
	private SubsidyApplicationController subsidyApplicationController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private SubsidyApplication subsidyApplication;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(subsidyApplicationController).build();
		subsidyApplication = SubsidyApplication.builder()
				.applicationId(1)
				.farmerId(1)
				.schemeId(1)
				.applicationDate(LocalDate.of(2026, 2, 1))
				.eligibilityScore(85.5)
				.reviewedBy(2)
				.disbursedAmount(6000.0)
				.disbursedDate(LocalDate.of(2026, 3, 1))
				.status(ApplicationStatus.AP)
				.build();
	}

	@Test
	void getAllReturnsData() throws Exception {
		when(subsidyApplicationService.getAll()).thenReturn(List.of(subsidyApplication));

		mockMvc.perform(get("/agriLink/subsidyScheme/fetchApplications"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].status").value("AP"));
	}

	@Test
	void getByIdReturnsData() throws Exception {
		when(subsidyApplicationService.getById(1)).thenReturn(subsidyApplication);

		mockMvc.perform(get("/agriLink/subsidyScheme/fetchApplicationById/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.farmerId").value(1));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(subsidyApplicationService.create(any(SubsidyApplicationDto.class))).thenReturn(subsidyApplication);

		mockMvc.perform(post("/agriLink/subsidyScheme/createApplication")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new SubsidyApplicationDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("SubsidyApplication created successfully"));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(subsidyApplicationService.update(eq(1), any(SubsidyApplicationDto.class))).thenReturn(subsidyApplication);

		mockMvc.perform(put("/agriLink/subsidyScheme/updateApplication/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new SubsidyApplicationDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("SubsidyApplication updated successfully"));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/agriLink/subsidyScheme/deleteApplication/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("SubsidyApplication deleted successfully"));
	}

	// ── Ownership enforcement ─────────────────────────────────────────────

	private static org.springframework.security.core.Authentication farmer(Integer userId) {
		return new org.springframework.security.authentication.UsernamePasswordAuthenticationToken(
				userId, null,
				List.of(new org.springframework.security.core.authority.SimpleGrantedAuthority("ROLE_Farmer")));
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

	@Test
	void farmerSeesOnlyOwnApplications() throws Exception {
		subsidyApplication.setUserId(7);
		when(subsidyApplicationService.getByUserId(7)).thenReturn(List.of(subsidyApplication));

		mockMvc.perform(get("/agriLink/subsidyScheme/fetchApplications").principal(farmer(7)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].status").value("AP"));
	}

	@Test
	void farmerCannotViewAnotherUsersApplication() {
		subsidyApplication.setUserId(1); // owned by user 1; caller is user 2
		when(subsidyApplicationService.getById(1)).thenReturn(subsidyApplication);

		Throwable thrown = org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () ->
				mockMvc.perform(get("/agriLink/subsidyScheme/fetchApplicationById/1").principal(farmer(2))));
		assertAccessDenied(thrown);
	}

	@Test
	void farmerCannotUpdateAnotherUsersApplication() {
		subsidyApplication.setUserId(1);
		when(subsidyApplicationService.getById(1)).thenReturn(subsidyApplication);

		Throwable thrown = org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () ->
				mockMvc.perform(put("/agriLink/subsidyScheme/updateApplication/1")
						.principal(farmer(2))
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new SubsidyApplicationDto()))));
		assertAccessDenied(thrown);
	}

	@Test
	void farmerCreateIsForcedToOwnUserIdAndCannotSelfDisburse() throws Exception {
		when(subsidyApplicationService.create(any(SubsidyApplicationDto.class))).thenReturn(subsidyApplication);
		// Farmer (user 7) tries to file under user 999 and self-record a disbursement.
		SubsidyApplicationDto payload = SubsidyApplicationDto.builder()
				.userId(999)
				.schemeId(5)
				.disbursedAmount(6000.0)
				.reviewedBy(2)
				.disbursedDate(LocalDate.of(2026, 3, 1))
				.build();

		ObjectMapper dateAwareMapper = new ObjectMapper().findAndRegisterModules();
		mockMvc.perform(post("/agriLink/subsidyScheme/createApplication")
						.principal(farmer(7))
						.contentType(MediaType.APPLICATION_JSON)
						.content(dateAwareMapper.writeValueAsString(payload)))
				.andExpect(status().isOk());

		org.mockito.ArgumentCaptor<SubsidyApplicationDto> captor =
				org.mockito.ArgumentCaptor.forClass(SubsidyApplicationDto.class);
		org.mockito.Mockito.verify(subsidyApplicationService).create(captor.capture());
		SubsidyApplicationDto saved = captor.getValue();
		org.junit.jupiter.api.Assertions.assertEquals(7, saved.getUserId());
		org.junit.jupiter.api.Assertions.assertNull(saved.getDisbursedAmount());
		org.junit.jupiter.api.Assertions.assertNull(saved.getReviewedBy());
		org.junit.jupiter.api.Assertions.assertNull(saved.getDisbursedDate());
	}
}

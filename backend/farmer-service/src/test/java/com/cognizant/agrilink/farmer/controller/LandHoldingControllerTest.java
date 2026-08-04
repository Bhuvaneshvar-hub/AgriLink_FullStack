package com.cognizant.agrilink.farmer.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.ArgumentMatchers.isNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cognizant.agrilink.farmer.dto.LandHoldingDto;
import com.cognizant.agrilink.farmer.entity.FarmerProfile;
import com.cognizant.agrilink.farmer.entity.LandHolding;
import com.cognizant.agrilink.farmer.enums.Status;
import com.cognizant.agrilink.farmer.notification.NotificationClient;
import com.cognizant.agrilink.farmer.service.FarmerProfileService;
import com.cognizant.agrilink.farmer.service.LandHoldingService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class LandHoldingControllerTest {

	@Mock
	private LandHoldingService landHoldingService;

	@Mock
	private FarmerProfileService farmerProfileService;

	@Mock
	private NotificationClient notificationClient;

	@InjectMocks
	private LandHoldingController landHoldingController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private LandHolding landHolding;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(landHoldingController).build();
		landHolding = LandHolding.builder()
				.holdingId(1)
				.farmerId(1)
				.surveyNumber("SY-101/2A")
				.areaAcres(5.5)
				.soilType("Black")
				.irrigationSource("Borewell")
				.ownershipType("Owned")
				.status(Status.AC)
				.build();
	}

	@Test
	void getAllReturnsData() throws Exception {
		when(landHoldingService.getAll()).thenReturn(List.of(landHolding));

		mockMvc.perform(get("/land-holdings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].surveyNumber").value("SY-101/2A"));
	}

	@Test
	void getByIdReturnsData() throws Exception {
		when(landHoldingService.getById(1)).thenReturn(landHolding);

		mockMvc.perform(get("/land-holdings/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.soilType").value("Black"));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(landHoldingService.create(any(LandHoldingDto.class))).thenReturn(landHolding);

		mockMvc.perform(post("/land-holdings")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new LandHoldingDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("LandHolding submitted successfully"));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(landHoldingService.update(eq(1), any(LandHoldingDto.class))).thenReturn(landHolding);

		mockMvc.perform(put("/land-holdings/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new LandHoldingDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("LandHolding updated successfully"));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/land-holdings/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("LandHolding deleted successfully"));
	}

	@Test
	void approveNotifiesOwner() throws Exception {
		when(landHoldingService.setStatus(1, Status.AC)).thenReturn(landHolding);
		when(farmerProfileService.getById(1))
				.thenReturn(FarmerProfile.builder().farmerId(1).userId(42).build());

		mockMvc.perform(put("/land-holdings/1/approve"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("LandHolding approved"));

		// The owning farmer (userId 42) is alerted; admins see it too (unscoped list).
		verify(notificationClient).notify(eq(42), anyString(), eq("Compliance"), isNull());
	}

	@Test
	void rejectNotifiesOwner() throws Exception {
		when(landHoldingService.setStatus(1, Status.DP)).thenReturn(landHolding);
		when(farmerProfileService.getById(1))
				.thenReturn(FarmerProfile.builder().farmerId(1).userId(42).build());

		mockMvc.perform(put("/land-holdings/1/reject"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("LandHolding marked disputed"));

		verify(notificationClient).notify(eq(42), anyString(), eq("Compliance"), isNull());
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
	void farmerCannotViewAnotherFarmersHolding() {
		// holding belongs to farmerId 1; caller (userId 2) owns only farmerId 99
		when(landHoldingService.getById(1)).thenReturn(landHolding);
		when(farmerProfileService.getByUserId(2))
				.thenReturn(List.of(FarmerProfile.builder().farmerId(99).userId(2).build()));

		Throwable thrown = org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () ->
				mockMvc.perform(get("/land-holdings/1").principal(farmer(2))));
		assertAccessDenied(thrown);
	}

	@Test
	void farmerCanViewOwnHolding() throws Exception {
		// holding belongs to farmerId 1; caller (userId 2) owns farmerId 1
		when(landHoldingService.getById(1)).thenReturn(landHolding);
		when(farmerProfileService.getByUserId(2))
				.thenReturn(List.of(FarmerProfile.builder().farmerId(1).userId(2).build()));

		mockMvc.perform(get("/land-holdings/1").principal(farmer(2)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.soilType").value("Black"));
	}

	@Test
	void farmerCannotCreateHoldingForAnotherFarmer() {
		// caller (userId 2) owns only farmerId 99 but posts a holding for farmerId 1
		when(farmerProfileService.getByUserId(2))
				.thenReturn(List.of(FarmerProfile.builder().farmerId(99).userId(2).build()));

		Throwable thrown = org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () ->
				mockMvc.perform(post("/land-holdings")
						.principal(farmer(2))
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(
								LandHoldingDto.builder().farmerId(1).build()))));
		assertAccessDenied(thrown);
	}
}

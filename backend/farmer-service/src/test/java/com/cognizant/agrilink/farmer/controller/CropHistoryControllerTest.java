package com.cognizant.agrilink.farmer.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cognizant.agrilink.farmer.dto.CropHistoryDto;
import com.cognizant.agrilink.farmer.entity.CropHistory;
import com.cognizant.agrilink.farmer.entity.FarmerProfile;
import com.cognizant.agrilink.farmer.service.CropHistoryService;
import com.cognizant.agrilink.farmer.service.FarmerProfileService;
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
class CropHistoryControllerTest {

	@Mock
	private CropHistoryService cropHistoryService;

	@Mock
	private FarmerProfileService farmerProfileService;

	@InjectMocks
	private CropHistoryController cropHistoryController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private CropHistory cropHistory;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(cropHistoryController).build();
		cropHistory = CropHistory.builder()
				.historyId(1)
				.holdingId(1)
				.farmerId(1)
				.cropName("Paddy")
				.season("Kharif")
				.cropYear(2024)
				.areaAcres(4.2)
				.yieldQuintals(92.5)
				.remarks("Good monsoon")
				.build();
	}

	@Test
	void getAllReturnsData() throws Exception {
		when(cropHistoryService.getAll()).thenReturn(List.of(cropHistory));

		mockMvc.perform(get("/crop-histories"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].cropName").value("Paddy"));
	}

	@Test
	void getByIdReturnsData() throws Exception {
		when(cropHistoryService.getById(1)).thenReturn(cropHistory);

		mockMvc.perform(get("/crop-histories/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.season").value("Kharif"));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(cropHistoryService.create(any(CropHistoryDto.class))).thenReturn(cropHistory);

		mockMvc.perform(post("/crop-histories")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CropHistoryDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropHistory recorded successfully"));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(cropHistoryService.update(eq(1), any(CropHistoryDto.class))).thenReturn(cropHistory);

		mockMvc.perform(put("/crop-histories/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CropHistoryDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropHistory updated successfully"));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/crop-histories/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropHistory deleted successfully"));
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
	void farmerCannotViewAnotherFarmersHistory() {
		// record belongs to farmerId 1; caller (userId 2) owns only farmerId 99
		when(cropHistoryService.getById(1)).thenReturn(cropHistory);
		when(farmerProfileService.getByUserId(2))
				.thenReturn(List.of(FarmerProfile.builder().farmerId(99).userId(2).build()));

		Throwable thrown = org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () ->
				mockMvc.perform(get("/crop-histories/1").principal(farmer(2))));
		assertAccessDenied(thrown);
	}

	@Test
	void farmerCanViewOwnHistory() throws Exception {
		// record belongs to farmerId 1; caller (userId 2) owns farmerId 1
		when(cropHistoryService.getById(1)).thenReturn(cropHistory);
		when(farmerProfileService.getByUserId(2))
				.thenReturn(List.of(FarmerProfile.builder().farmerId(1).userId(2).build()));

		mockMvc.perform(get("/crop-histories/1").principal(farmer(2)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.cropName").value("Paddy"));
	}

	@Test
	void farmerCannotCreateHistoryForAnotherFarmer() {
		// caller (userId 2) owns only farmerId 99 but posts a record for farmerId 1
		when(farmerProfileService.getByUserId(2))
				.thenReturn(List.of(FarmerProfile.builder().farmerId(99).userId(2).build()));

		Throwable thrown = org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () ->
				mockMvc.perform(post("/crop-histories")
						.principal(farmer(2))
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(
								CropHistoryDto.builder().farmerId(1).build()))));
		assertAccessDenied(thrown);
	}
}

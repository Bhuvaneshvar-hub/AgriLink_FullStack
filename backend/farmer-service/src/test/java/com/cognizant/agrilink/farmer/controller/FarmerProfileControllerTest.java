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

import com.cognizant.agrilink.farmer.client.IamStatusClient;
import com.cognizant.agrilink.farmer.dto.FarmerProfileDto;
import com.cognizant.agrilink.farmer.entity.FarmerProfile;
import com.cognizant.agrilink.farmer.enums.Status;
import com.cognizant.agrilink.farmer.service.FarmerProfileService;
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
class FarmerProfileControllerTest {

	@Mock
	private FarmerProfileService farmerProfileService;

	@Mock
	private IamStatusClient iamStatusClient;

	@InjectMocks
	private FarmerProfileController farmerProfileController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private FarmerProfile farmerProfile;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(farmerProfileController).build();
		farmerProfile = FarmerProfile.builder()
				.farmerId(1)
				.userId(1)
				.name("Ramesh Kumar")
				.dateOfBirth(LocalDate.of(1985, 4, 12))
				.gender("Male")
				.nationalIdNumber("ABCD1234")
				.village("Kovilpatti")
				.district("Thoothukudi")
				.state("Tamil Nadu")
				.phone("9876543210")
				.bankAccountNumber("1234567890")
				.status(Status.AC)
				.build();
	}

	@Test
	void getAllReturnsData() throws Exception {
		when(farmerProfileService.getAll()).thenReturn(List.of(farmerProfile));

		mockMvc.perform(get("/farmer-profiles"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Ramesh Kumar"));
	}

	@Test
	void getByIdReturnsData() throws Exception {
		when(farmerProfileService.getById(1)).thenReturn(farmerProfile);

		mockMvc.perform(get("/farmer-profiles/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.village").value("Kovilpatti"));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(farmerProfileService.create(any(FarmerProfileDto.class))).thenReturn(farmerProfile);

		mockMvc.perform(post("/farmer-profiles")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new FarmerProfileDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("FarmerProfile created successfully"));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(farmerProfileService.update(eq(1), any(FarmerProfileDto.class))).thenReturn(farmerProfile);

		mockMvc.perform(put("/farmer-profiles/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new FarmerProfileDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("FarmerProfile updated successfully"));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/farmer-profiles/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("FarmerProfile deleted successfully"));
	}

	@Test
	void verifyReturnsMessageOnly() throws Exception {
		when(farmerProfileService.setStatus(1, Status.VE)).thenReturn(farmerProfile);

		mockMvc.perform(put("/farmer-profiles/1/verify"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("FarmerProfile verified"));
	}

	@Test
	void activateReturnsMessageOnly() throws Exception {
		when(farmerProfileService.setStatus(1, Status.AC)).thenReturn(farmerProfile);

		mockMvc.perform(put("/farmer-profiles/1/activate"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("FarmerProfile activated"));
	}

	@Test
	void deactivateReturnsMessageOnly() throws Exception {
		when(farmerProfileService.setStatus(1, Status.IN)).thenReturn(farmerProfile);

		mockMvc.perform(put("/farmer-profiles/1/deactivate"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("FarmerProfile deactivated"));
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
	void farmerCannotUpdateAnotherUsersProfile() {
		// profile belongs to userId 1; caller is farmer userId 2
		when(farmerProfileService.getById(1)).thenReturn(farmerProfile);

		Throwable thrown = org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () ->
				mockMvc.perform(put("/farmer-profiles/1")
						.principal(farmer(2))
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new FarmerProfileDto()))));
		assertAccessDenied(thrown);
	}

	@Test
	void farmerCanUpdateOwnProfile() throws Exception {
		// profile belongs to userId 1; caller is farmer userId 1
		when(farmerProfileService.getById(1)).thenReturn(farmerProfile);
		when(farmerProfileService.update(eq(1), any(FarmerProfileDto.class))).thenReturn(farmerProfile);

		mockMvc.perform(put("/farmer-profiles/1")
						.principal(farmer(1))
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new FarmerProfileDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("FarmerProfile updated successfully"));
	}

	@Test
	void farmerCannotDeleteAnotherUsersProfile() {
		when(farmerProfileService.getById(1)).thenReturn(farmerProfile);

		Throwable thrown = org.junit.jupiter.api.Assertions.assertThrows(Exception.class, () ->
				mockMvc.perform(delete("/farmer-profiles/1").principal(farmer(2))));
		assertAccessDenied(thrown);
	}
}

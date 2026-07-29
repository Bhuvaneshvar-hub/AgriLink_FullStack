package com.cognizant.agrilink.farmer.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class FarmerProfileControllerExtendedTest {

	@Mock
	private FarmerProfileService farmerProfileService;

	@InjectMocks
	private FarmerProfileController farmerProfileController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

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
	void getByIdReturnsAllFields() throws Exception {
		when(farmerProfileService.getById(1)).thenReturn(farmerProfile);

		mockMvc.perform(get("/farmer-profiles/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.farmerId").value(1))
				.andExpect(jsonPath("$.userId").value(1))
				.andExpect(jsonPath("$.name").value("Ramesh Kumar"))
				.andExpect(jsonPath("$.dateOfBirth").value("1985-04-12"))
				.andExpect(jsonPath("$.gender").value("Male"))
				.andExpect(jsonPath("$.nationalIdNumber").value("ABCD1234"))
				.andExpect(jsonPath("$.village").value("Kovilpatti"))
				.andExpect(jsonPath("$.district").value("Thoothukudi"))
				.andExpect(jsonPath("$.state").value("Tamil Nadu"))
				.andExpect(jsonPath("$.phone").value("9876543210"))
				.andExpect(jsonPath("$.bankAccountNumber").value("1234567890"))
				.andExpect(jsonPath("$.status").value("AC"));
	}

	@Test
	void getAllReturnsAllFields() throws Exception {
		when(farmerProfileService.getAll()).thenReturn(List.of(farmerProfile));

		mockMvc.perform(get("/farmer-profiles"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].farmerId").value(1))
				.andExpect(jsonPath("$[0].name").value("Ramesh Kumar"))
				.andExpect(jsonPath("$[0].gender").value("Male"))
				.andExpect(jsonPath("$[0].district").value("Thoothukudi"))
				.andExpect(jsonPath("$[0].status").value("AC"));
	}

	@Test
	void getAllReturnsEmptyArray() throws Exception {
		when(farmerProfileService.getAll()).thenReturn(List.of());

		mockMvc.perform(get("/farmer-profiles"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isArray())
				.andExpect(jsonPath("$").isEmpty());
	}

	@Test
	void getAllReturnsMultiple() throws Exception {
		FarmerProfile second = FarmerProfile.builder().farmerId(2).name("Suresh").build();
		when(farmerProfileService.getAll()).thenReturn(List.of(farmerProfile, second));

		mockMvc.perform(get("/farmer-profiles"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Ramesh Kumar"))
				.andExpect(jsonPath("$[1].name").value("Suresh"))
				.andExpect(jsonPath("$.length()").value(2));
	}

	@Test
	void getAllInvokesService() throws Exception {
		when(farmerProfileService.getAll()).thenReturn(List.of(farmerProfile));

		mockMvc.perform(get("/farmer-profiles")).andExpect(status().isOk());

		verify(farmerProfileService, times(1)).getAll();
	}

	@Test
	void getByIdInvokesService() throws Exception {
		when(farmerProfileService.getById(1)).thenReturn(farmerProfile);

		mockMvc.perform(get("/farmer-profiles/1")).andExpect(status().isOk());

		verify(farmerProfileService, times(1)).getById(1);
	}

	@Test
	void createReturnsOnlyMessage() throws Exception {
		when(farmerProfileService.create(any(FarmerProfileDto.class))).thenReturn(farmerProfile);

		mockMvc.perform(post("/farmer-profiles")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new FarmerProfileDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("FarmerProfile created successfully"))
				.andExpect(jsonPath("$.name").doesNotExist())
				.andExpect(jsonPath("$.farmerId").doesNotExist());
	}

	@Test
	void createInvokesService() throws Exception {
		when(farmerProfileService.create(any(FarmerProfileDto.class))).thenReturn(farmerProfile);

		mockMvc.perform(post("/farmer-profiles")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new FarmerProfileDto())))
				.andExpect(status().isOk());

		verify(farmerProfileService, times(1)).create(any(FarmerProfileDto.class));
	}

	@Test
	void updateReturnsOnlyMessage() throws Exception {
		when(farmerProfileService.update(eq(1), any(FarmerProfileDto.class))).thenReturn(farmerProfile);

		mockMvc.perform(put("/farmer-profiles/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new FarmerProfileDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("FarmerProfile updated successfully"))
				.andExpect(jsonPath("$.name").doesNotExist());
	}

	@Test
	void updateInvokesService() throws Exception {
		when(farmerProfileService.update(eq(1), any(FarmerProfileDto.class))).thenReturn(farmerProfile);

		mockMvc.perform(put("/farmer-profiles/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new FarmerProfileDto())))
				.andExpect(status().isOk());

		verify(farmerProfileService, times(1)).update(eq(1), any(FarmerProfileDto.class));
	}

	@Test
	void deleteReturnsOnlyMessage() throws Exception {
		mockMvc.perform(delete("/farmer-profiles/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("FarmerProfile deleted successfully"))
				.andExpect(jsonPath("$.name").doesNotExist());
	}

	@Test
	void deleteInvokesService() throws Exception {
		mockMvc.perform(delete("/farmer-profiles/1")).andExpect(status().isOk());

		verify(farmerProfileService, times(1)).delete(1);
	}

	@Test
	void createSendsDtoToService() throws Exception {
		when(farmerProfileService.create(any(FarmerProfileDto.class))).thenReturn(farmerProfile);
		FarmerProfileDto body = FarmerProfileDto.builder()
				.name("Test")
				.gender("Female")
				.build();

		mockMvc.perform(post("/farmer-profiles")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isOk());

		verify(farmerProfileService).create(any(FarmerProfileDto.class));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 5, 10, 100, 9999})
	void getByIdWithVariousIds(int id) throws Exception {
		FarmerProfile p = FarmerProfile.builder().farmerId(id).name("X").build();
		when(farmerProfileService.getById(id)).thenReturn(p);

		mockMvc.perform(get("/farmer-profiles/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.farmerId").value(id));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 5, 42, 999})
	void deleteWithVariousIds(int id) throws Exception {
		mockMvc.perform(delete("/farmer-profiles/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("FarmerProfile deleted successfully"));

		verify(farmerProfileService).delete(id);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 3, 7, 50})
	void updateWithVariousIds(int id) throws Exception {
		when(farmerProfileService.update(eq(id), any(FarmerProfileDto.class))).thenReturn(farmerProfile);

		mockMvc.perform(put("/farmer-profiles/" + id)
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new FarmerProfileDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("FarmerProfile updated successfully"));

		verify(farmerProfileService).update(eq(id), any(FarmerProfileDto.class));
	}

	@ParameterizedTest
	@CsvSource({
			"Ramesh, Male, AC",
			"Lakshmi, Female, IN",
			"Karthik, Male, AC",
			"Priya, Female, AC"
	})
	void getByIdReflectsVariousData(String name, String gender, Status status) throws Exception {
		FarmerProfile p = FarmerProfile.builder()
				.farmerId(1).name(name).gender(gender).status(status).build();
		when(farmerProfileService.getById(1)).thenReturn(p);

		mockMvc.perform(get("/farmer-profiles/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.name").value(name))
				.andExpect(jsonPath("$.gender").value(gender))
				.andExpect(jsonPath("$.status").value(status.name()));
	}
}

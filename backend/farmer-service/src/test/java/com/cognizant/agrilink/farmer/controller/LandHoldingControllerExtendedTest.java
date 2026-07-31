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

import com.cognizant.agrilink.farmer.dto.LandHoldingDto;
import com.cognizant.agrilink.farmer.entity.LandHolding;
import com.cognizant.agrilink.farmer.enums.Status;
import com.cognizant.agrilink.farmer.service.LandHoldingService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class LandHoldingControllerExtendedTest {

	@Mock
	private LandHoldingService landHoldingService;

	@InjectMocks
	private LandHoldingController landHoldingController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

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
	void getByIdReturnsAllFields() throws Exception {
		when(landHoldingService.getById(1)).thenReturn(landHolding);

		mockMvc.perform(get("/land-holdings/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.holdingId").value(1))
				.andExpect(jsonPath("$.farmerId").value(1))
				.andExpect(jsonPath("$.surveyNumber").value("SY-101/2A"))
				.andExpect(jsonPath("$.areaAcres").value(5.5))
				.andExpect(jsonPath("$.soilType").value("Black"))
				.andExpect(jsonPath("$.irrigationSource").value("Borewell"))
				.andExpect(jsonPath("$.ownershipType").value("Owned"))
				.andExpect(jsonPath("$.status").value("AC"));
	}

	@Test
	void getAllReturnsAllFields() throws Exception {
		when(landHoldingService.getAll()).thenReturn(List.of(landHolding));

		mockMvc.perform(get("/land-holdings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].holdingId").value(1))
				.andExpect(jsonPath("$[0].surveyNumber").value("SY-101/2A"))
				.andExpect(jsonPath("$[0].soilType").value("Black"))
				.andExpect(jsonPath("$[0].ownershipType").value("Owned"))
				.andExpect(jsonPath("$[0].status").value("AC"));
	}

	@Test
	void getAllReturnsEmptyArray() throws Exception {
		when(landHoldingService.getAll()).thenReturn(List.of());

		mockMvc.perform(get("/land-holdings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isArray())
				.andExpect(jsonPath("$").isEmpty());
	}

	@Test
	void getAllReturnsMultiple() throws Exception {
		LandHolding second = LandHolding.builder().holdingId(2).surveyNumber("SY-202").build();
		when(landHoldingService.getAll()).thenReturn(List.of(landHolding, second));

		mockMvc.perform(get("/land-holdings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].surveyNumber").value("SY-101/2A"))
				.andExpect(jsonPath("$[1].surveyNumber").value("SY-202"))
				.andExpect(jsonPath("$.length()").value(2));
	}

	@Test
	void getAllInvokesService() throws Exception {
		when(landHoldingService.getAll()).thenReturn(List.of(landHolding));

		mockMvc.perform(get("/land-holdings")).andExpect(status().isOk());

		verify(landHoldingService, times(1)).getAll();
	}

	@Test
	void getByIdInvokesService() throws Exception {
		when(landHoldingService.getById(1)).thenReturn(landHolding);

		mockMvc.perform(get("/land-holdings/1")).andExpect(status().isOk());

		verify(landHoldingService, times(1)).getById(1);
	}

	@Test
	void createReturnsOnlyMessage() throws Exception {
		when(landHoldingService.create(any(LandHoldingDto.class))).thenReturn(landHolding);

		mockMvc.perform(post("/land-holdings")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new LandHoldingDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("LandHolding submitted successfully"))
				.andExpect(jsonPath("$.surveyNumber").doesNotExist())
				.andExpect(jsonPath("$.holdingId").doesNotExist());
	}

	@Test
	void createInvokesService() throws Exception {
		when(landHoldingService.create(any(LandHoldingDto.class))).thenReturn(landHolding);

		mockMvc.perform(post("/land-holdings")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new LandHoldingDto())))
				.andExpect(status().isOk());

		verify(landHoldingService, times(1)).create(any(LandHoldingDto.class));
	}

	@Test
	void updateReturnsOnlyMessage() throws Exception {
		when(landHoldingService.update(eq(1), any(LandHoldingDto.class))).thenReturn(landHolding);

		mockMvc.perform(put("/land-holdings/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new LandHoldingDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("LandHolding updated successfully"))
				.andExpect(jsonPath("$.surveyNumber").doesNotExist());
	}

	@Test
	void updateInvokesService() throws Exception {
		when(landHoldingService.update(eq(1), any(LandHoldingDto.class))).thenReturn(landHolding);

		mockMvc.perform(put("/land-holdings/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new LandHoldingDto())))
				.andExpect(status().isOk());

		verify(landHoldingService, times(1)).update(eq(1), any(LandHoldingDto.class));
	}

	@Test
	void deleteReturnsOnlyMessage() throws Exception {
		mockMvc.perform(delete("/land-holdings/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("LandHolding deleted successfully"))
				.andExpect(jsonPath("$.surveyNumber").doesNotExist());
	}

	@Test
	void deleteInvokesService() throws Exception {
		mockMvc.perform(delete("/land-holdings/1")).andExpect(status().isOk());

		verify(landHoldingService, times(1)).delete(1);
	}

	@Test
	void createSendsDtoToService() throws Exception {
		when(landHoldingService.create(any(LandHoldingDto.class))).thenReturn(landHolding);
		LandHoldingDto body = LandHoldingDto.builder()
				.surveyNumber("SY-1").areaAcres(3.3).soilType("Red").build();

		mockMvc.perform(post("/land-holdings")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isOk());

		verify(landHoldingService).create(any(LandHoldingDto.class));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 5, 10, 100, 9999})
	void getByIdWithVariousIds(int id) throws Exception {
		LandHolding h = LandHolding.builder().holdingId(id).surveyNumber("X").build();
		when(landHoldingService.getById(id)).thenReturn(h);

		mockMvc.perform(get("/land-holdings/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.holdingId").value(id));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 5, 42, 999})
	void deleteWithVariousIds(int id) throws Exception {
		mockMvc.perform(delete("/land-holdings/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("LandHolding deleted successfully"));

		verify(landHoldingService).delete(id);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 3, 7, 50})
	void updateWithVariousIds(int id) throws Exception {
		when(landHoldingService.update(eq(id), any(LandHoldingDto.class))).thenReturn(landHolding);

		mockMvc.perform(put("/land-holdings/" + id)
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new LandHoldingDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("LandHolding updated successfully"));

		verify(landHoldingService).update(eq(id), any(LandHoldingDto.class));
	}

	@ParameterizedTest
	@CsvSource({
			"SY-1, Black, Owned",
			"SY-2, Red, Leased",
			"SY-3, Alluvial, Rented",
			"SY-4, Clay, Inherited"
	})
	void getByIdReflectsVariousData(String surveyNumber, String soilType, String ownership) throws Exception {
		LandHolding h = LandHolding.builder()
				.holdingId(1).surveyNumber(surveyNumber).soilType(soilType).ownershipType(ownership).build();
		when(landHoldingService.getById(1)).thenReturn(h);

		mockMvc.perform(get("/land-holdings/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.surveyNumber").value(surveyNumber))
				.andExpect(jsonPath("$.soilType").value(soilType))
				.andExpect(jsonPath("$.ownershipType").value(ownership));
	}
}

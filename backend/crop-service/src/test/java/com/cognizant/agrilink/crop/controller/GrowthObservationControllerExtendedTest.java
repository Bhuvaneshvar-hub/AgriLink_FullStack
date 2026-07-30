package com.cognizant.agrilink.crop.controller;

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

import com.cognizant.agrilink.crop.enums.Stage;
import com.cognizant.agrilink.crop.dto.GrowthObservationDto;
import com.cognizant.agrilink.crop.entity.GrowthObservation;
import com.cognizant.agrilink.crop.service.GrowthObservationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class GrowthObservationControllerExtendedTest {

	@Mock
	private GrowthObservationService growthObservationService;

	@InjectMocks
	private GrowthObservationController growthObservationController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

	private GrowthObservation growthObservation;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(growthObservationController).build();
		growthObservation = GrowthObservation.builder()
				.observationId(1)
				.planId(1)
				.officerId(2)
				.observationDate(LocalDate.of(2026, 6, 15))
				.stage(Stage.FLOWERING)
				.pestOrDiseaseFlag(false)
				.remarks("Healthy crop")
				.build();
	}

	@Test
	void getAllReturnsAllFields() throws Exception {
		when(growthObservationService.getAll()).thenReturn(List.of(growthObservation));

		mockMvc.perform(get("/growth-observations"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].observationId").value(1))
				.andExpect(jsonPath("$[0].planId").value(1))
				.andExpect(jsonPath("$[0].officerId").value(2))
				.andExpect(jsonPath("$[0].stage").value("FLOWERING"))
				.andExpect(jsonPath("$[0].pestOrDiseaseFlag").value(false))
				.andExpect(jsonPath("$[0].remarks").value("Healthy crop"));
		verify(growthObservationService).getAll();
	}

	@Test
	void getAllReturnsEmptyList() throws Exception {
		when(growthObservationService.getAll()).thenReturn(Collections.emptyList());

		mockMvc.perform(get("/growth-observations"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isEmpty());
		verify(growthObservationService).getAll();
	}

	@Test
	void getAllReturnsManyRecords() throws Exception {
		when(growthObservationService.getAll()).thenReturn(List.of(growthObservation, growthObservation, growthObservation));

		mockMvc.perform(get("/growth-observations"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(3));
	}

	@Test
	void getByIdReturnsAllFields() throws Exception {
		when(growthObservationService.getById(1)).thenReturn(growthObservation);

		mockMvc.perform(get("/growth-observations/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.observationId").value(1))
				.andExpect(jsonPath("$.planId").value(1))
				.andExpect(jsonPath("$.officerId").value(2))
				.andExpect(jsonPath("$.stage").value("FLOWERING"))
				.andExpect(jsonPath("$.pestOrDiseaseFlag").value(false))
				.andExpect(jsonPath("$.remarks").value("Healthy crop"));
		verify(growthObservationService).getById(1);
	}

	@Test
	void getByIdReturnsTrueFlag() throws Exception {
		growthObservation.setPestOrDiseaseFlag(true);
		when(growthObservationService.getById(1)).thenReturn(growthObservation);

		mockMvc.perform(get("/growth-observations/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.pestOrDiseaseFlag").value(true));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(growthObservationService.create(any(GrowthObservationDto.class))).thenReturn(growthObservation);

		mockMvc.perform(post("/growth-observations")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new GrowthObservationDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("GrowthObservation created successfully"))
				.andExpect(jsonPath("$.stage").doesNotExist());
		verify(growthObservationService).create(any(GrowthObservationDto.class));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(growthObservationService.update(eq(1), any(GrowthObservationDto.class))).thenReturn(growthObservation);

		mockMvc.perform(put("/growth-observations/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new GrowthObservationDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("GrowthObservation updated successfully"))
				.andExpect(jsonPath("$.stage").doesNotExist());
		verify(growthObservationService).update(eq(1), any(GrowthObservationDto.class));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/growth-observations/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("GrowthObservation deleted successfully"));
		verify(growthObservationService).delete(1);
	}

	@ParameterizedTest
	@ValueSource(ints = { 1, 2, 65, 700, 22222 })
	void getByIdWithVariousIds(int id) throws Exception {
		when(growthObservationService.getById(id)).thenReturn(growthObservation);

		mockMvc.perform(get("/growth-observations/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.stage").value("FLOWERING"));
		verify(growthObservationService).getById(id);
	}

	@ParameterizedTest
	@ValueSource(ints = { 1, 7, 95, 5005 })
	void deleteWithVariousIds(int id) throws Exception {
		mockMvc.perform(delete("/growth-observations/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("GrowthObservation deleted successfully"));
		verify(growthObservationService).delete(id);
	}

	@ParameterizedTest
	@ValueSource(ints = { 1, 8, 80, 6006 })
	void updateWithVariousIds(int id) throws Exception {
		when(growthObservationService.update(eq(id), any(GrowthObservationDto.class))).thenReturn(growthObservation);

		mockMvc.perform(put("/growth-observations/" + id)
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new GrowthObservationDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("GrowthObservation updated successfully"));
		verify(growthObservationService).update(eq(id), any(GrowthObservationDto.class));
	}
}



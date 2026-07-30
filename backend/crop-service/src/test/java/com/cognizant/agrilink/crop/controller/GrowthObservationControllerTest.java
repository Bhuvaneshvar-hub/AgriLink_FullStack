package com.cognizant.agrilink.crop.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
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
class GrowthObservationControllerTest {

	@Mock
	private GrowthObservationService growthObservationService;

	@InjectMocks
	private GrowthObservationController growthObservationController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private GrowthObservation growthObservation;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(growthObservationController).build();
		growthObservation = GrowthObservation.builder()
				.observationId(1)
				.planId(1)
				.officerId(2)
				.stage(Stage.FLOWERING)
				.pestOrDiseaseFlag(false)
				.remarks("Healthy crop")
				.build();
	}

	@Test
	void getAllReturnsData() throws Exception {
		when(growthObservationService.getAll()).thenReturn(List.of(growthObservation));

		mockMvc.perform(get("/growth-observations"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].stage").value("FLOWERING"));
	}

	@Test
	void getByIdReturnsData() throws Exception {
		when(growthObservationService.getById(1)).thenReturn(growthObservation);

		mockMvc.perform(get("/growth-observations/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.remarks").value("Healthy crop"));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(growthObservationService.create(any(GrowthObservationDto.class))).thenReturn(growthObservation);

		mockMvc.perform(post("/growth-observations")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new GrowthObservationDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("GrowthObservation created successfully"));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(growthObservationService.update(eq(1), any(GrowthObservationDto.class))).thenReturn(growthObservation);

		mockMvc.perform(put("/growth-observations/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new GrowthObservationDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("GrowthObservation updated successfully"));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/growth-observations/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("GrowthObservation deleted successfully"));
	}
}



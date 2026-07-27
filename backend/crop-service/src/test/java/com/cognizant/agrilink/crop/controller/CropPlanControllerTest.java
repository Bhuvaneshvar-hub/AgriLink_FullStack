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

import com.cognizant.agrilink.crop.enums.Status;
import com.cognizant.agrilink.crop.dto.CropPlanDto;
import com.cognizant.agrilink.crop.entity.CropPlan;
import com.cognizant.agrilink.crop.service.CropPlanService;
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
class CropPlanControllerTest {

	@Mock
	private CropPlanService cropPlanService;

	@InjectMocks
	private CropPlanController cropPlanController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private CropPlan cropPlan;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(cropPlanController).build();
		cropPlan = CropPlan.builder()
				.planId(1)
				.farmerId(1)
				.holdingId(2)
				.cropId(3)
				.season("Rabi")
				.year(2026)
				.areaPlanted(5.5)
				.status(Status.AC)
				.build();
	}

	@Test
	void getAllReturnsData() throws Exception {
		when(cropPlanService.getAll()).thenReturn(List.of(cropPlan));

		mockMvc.perform(get("/crop-plans"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].season").value("Rabi"));
	}

	@Test
	void getByIdReturnsData() throws Exception {
		when(cropPlanService.getById(1)).thenReturn(cropPlan);

		mockMvc.perform(get("/crop-plans/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("AC"));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(cropPlanService.create(any(CropPlanDto.class))).thenReturn(cropPlan);

		mockMvc.perform(post("/crop-plans")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CropPlanDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropPlan created successfully"));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(cropPlanService.update(eq(1), any(CropPlanDto.class))).thenReturn(cropPlan);

		mockMvc.perform(put("/crop-plans/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CropPlanDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropPlan updated successfully"));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/crop-plans/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropPlan deleted successfully"));
	}
}

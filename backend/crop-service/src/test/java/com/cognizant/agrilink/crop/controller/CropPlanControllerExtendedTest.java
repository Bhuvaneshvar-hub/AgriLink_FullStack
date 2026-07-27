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

import com.cognizant.agrilink.crop.enums.Status;
import com.cognizant.agrilink.crop.dto.CropPlanDto;
import com.cognizant.agrilink.crop.entity.CropPlan;
import com.cognizant.agrilink.crop.service.CropPlanService;
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
class CropPlanControllerExtendedTest {

	@Mock
	private CropPlanService cropPlanService;

	@InjectMocks
	private CropPlanController cropPlanController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

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
				.sowingDate(LocalDate.of(2026, 1, 10))
				.expectedHarvestDate(LocalDate.of(2026, 5, 10))
				.areaPlanted(5.5)
				.status(Status.AC)
				.build();
	}

	@Test
	void getAllReturnsAllFields() throws Exception {
		when(cropPlanService.getAll()).thenReturn(List.of(cropPlan));

		mockMvc.perform(get("/crop-plans"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].planId").value(1))
				.andExpect(jsonPath("$[0].farmerId").value(1))
				.andExpect(jsonPath("$[0].holdingId").value(2))
				.andExpect(jsonPath("$[0].cropId").value(3))
				.andExpect(jsonPath("$[0].season").value("Rabi"))
				.andExpect(jsonPath("$[0].year").value(2026))
				.andExpect(jsonPath("$[0].areaPlanted").value(5.5))
				.andExpect(jsonPath("$[0].status").value("AC"));
		verify(cropPlanService).getAll();
	}

	@Test
	void getAllReturnsEmptyList() throws Exception {
		when(cropPlanService.getAll()).thenReturn(Collections.emptyList());

		mockMvc.perform(get("/crop-plans"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isEmpty());
		verify(cropPlanService).getAll();
	}

	@Test
	void getAllReturnsManyRecords() throws Exception {
		when(cropPlanService.getAll()).thenReturn(List.of(cropPlan, cropPlan));

		mockMvc.perform(get("/crop-plans"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(2));
	}

	@Test
	void getByIdReturnsAllFields() throws Exception {
		when(cropPlanService.getById(1)).thenReturn(cropPlan);

		mockMvc.perform(get("/crop-plans/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.planId").value(1))
				.andExpect(jsonPath("$.farmerId").value(1))
				.andExpect(jsonPath("$.holdingId").value(2))
				.andExpect(jsonPath("$.cropId").value(3))
				.andExpect(jsonPath("$.season").value("Rabi"))
				.andExpect(jsonPath("$.year").value(2026))
				.andExpect(jsonPath("$.areaPlanted").value(5.5))
				.andExpect(jsonPath("$.status").value("AC"));
		verify(cropPlanService).getById(1);
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(cropPlanService.create(any(CropPlanDto.class))).thenReturn(cropPlan);

		mockMvc.perform(post("/crop-plans")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CropPlanDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropPlan created successfully"))
				.andExpect(jsonPath("$.season").doesNotExist());
		verify(cropPlanService).create(any(CropPlanDto.class));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(cropPlanService.update(eq(1), any(CropPlanDto.class))).thenReturn(cropPlan);

		mockMvc.perform(put("/crop-plans/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CropPlanDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropPlan updated successfully"))
				.andExpect(jsonPath("$.season").doesNotExist());
		verify(cropPlanService).update(eq(1), any(CropPlanDto.class));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/crop-plans/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropPlan deleted successfully"));
		verify(cropPlanService).delete(1);
	}

	@ParameterizedTest
	@ValueSource(ints = { 1, 2, 60, 888, 11111 })
	void getByIdWithVariousIds(int id) throws Exception {
		when(cropPlanService.getById(id)).thenReturn(cropPlan);

		mockMvc.perform(get("/crop-plans/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.season").value("Rabi"));
		verify(cropPlanService).getById(id);
	}

	@ParameterizedTest
	@ValueSource(ints = { 1, 5, 99, 3003 })
	void deleteWithVariousIds(int id) throws Exception {
		mockMvc.perform(delete("/crop-plans/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropPlan deleted successfully"));
		verify(cropPlanService).delete(id);
	}

	@ParameterizedTest
	@ValueSource(ints = { 1, 6, 70, 4004 })
	void updateWithVariousIds(int id) throws Exception {
		when(cropPlanService.update(eq(id), any(CropPlanDto.class))).thenReturn(cropPlan);

		mockMvc.perform(put("/crop-plans/" + id)
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CropPlanDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropPlan updated successfully"));
		verify(cropPlanService).update(eq(id), any(CropPlanDto.class));
	}
}

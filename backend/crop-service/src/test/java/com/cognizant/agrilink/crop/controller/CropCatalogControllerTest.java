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
import com.cognizant.agrilink.crop.dto.CropCatalogDto;
import com.cognizant.agrilink.crop.entity.CropCatalog;
import com.cognizant.agrilink.crop.service.CropCatalogService;
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
class CropCatalogControllerTest {

	@Mock
	private CropCatalogService cropCatalogService;

	@InjectMocks
	private CropCatalogController cropCatalogController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private CropCatalog cropCatalog;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(cropCatalogController).build();
		cropCatalog = CropCatalog.builder()
				.cropId(1)
				.cropName("Wheat")
				.category("Cereal")
				.season("Rabi")
				.typicalDurationDays(120)
				.expectedYieldPerAcre(20.5)
				.status(Status.AC)
				.build();
	}

	@Test
	void getAllReturnsData() throws Exception {
		when(cropCatalogService.getAll()).thenReturn(List.of(cropCatalog));

		mockMvc.perform(get("/crop-catalogs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].cropName").value("Wheat"));
	}

	@Test
	void getByIdReturnsData() throws Exception {
		when(cropCatalogService.getById(1)).thenReturn(cropCatalog);

		mockMvc.perform(get("/crop-catalogs/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.category").value("Cereal"));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(cropCatalogService.create(any(CropCatalogDto.class))).thenReturn(cropCatalog);

		mockMvc.perform(post("/crop-catalogs")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CropCatalogDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropCatalog created successfully"));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(cropCatalogService.update(eq(1), any(CropCatalogDto.class))).thenReturn(cropCatalog);

		mockMvc.perform(put("/crop-catalogs/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CropCatalogDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropCatalog updated successfully"));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/crop-catalogs/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropCatalog deleted successfully"));
	}
}

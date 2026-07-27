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
import com.cognizant.agrilink.crop.dto.CropCatalogDto;
import com.cognizant.agrilink.crop.entity.CropCatalog;
import com.cognizant.agrilink.crop.service.CropCatalogService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class CropCatalogControllerExtendedTest {

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
	void getAllReturnsAllFields() throws Exception {
		when(cropCatalogService.getAll()).thenReturn(List.of(cropCatalog));

		mockMvc.perform(get("/crop-catalogs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].cropId").value(1))
				.andExpect(jsonPath("$[0].cropName").value("Wheat"))
				.andExpect(jsonPath("$[0].category").value("Cereal"))
				.andExpect(jsonPath("$[0].season").value("Rabi"))
				.andExpect(jsonPath("$[0].typicalDurationDays").value(120))
				.andExpect(jsonPath("$[0].expectedYieldPerAcre").value(20.5))
				.andExpect(jsonPath("$[0].status").value("AC"));
		verify(cropCatalogService).getAll();
	}

	@Test
	void getAllReturnsEmptyList() throws Exception {
		when(cropCatalogService.getAll()).thenReturn(Collections.emptyList());

		mockMvc.perform(get("/crop-catalogs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isEmpty());
		verify(cropCatalogService).getAll();
	}

	@Test
	void getAllReturnsManyRecords() throws Exception {
		when(cropCatalogService.getAll()).thenReturn(List.of(cropCatalog, cropCatalog, cropCatalog));

		mockMvc.perform(get("/crop-catalogs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(3));
	}

	@Test
	void getByIdReturnsAllFields() throws Exception {
		when(cropCatalogService.getById(1)).thenReturn(cropCatalog);

		mockMvc.perform(get("/crop-catalogs/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.cropId").value(1))
				.andExpect(jsonPath("$.cropName").value("Wheat"))
				.andExpect(jsonPath("$.category").value("Cereal"))
				.andExpect(jsonPath("$.season").value("Rabi"))
				.andExpect(jsonPath("$.typicalDurationDays").value(120))
				.andExpect(jsonPath("$.expectedYieldPerAcre").value(20.5))
				.andExpect(jsonPath("$.status").value("AC"));
		verify(cropCatalogService).getById(1);
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(cropCatalogService.create(any(CropCatalogDto.class))).thenReturn(cropCatalog);

		mockMvc.perform(post("/crop-catalogs")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CropCatalogDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropCatalog created successfully"))
				.andExpect(jsonPath("$.cropName").doesNotExist());
		verify(cropCatalogService).create(any(CropCatalogDto.class));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(cropCatalogService.update(eq(1), any(CropCatalogDto.class))).thenReturn(cropCatalog);

		mockMvc.perform(put("/crop-catalogs/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CropCatalogDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropCatalog updated successfully"))
				.andExpect(jsonPath("$.cropName").doesNotExist());
		verify(cropCatalogService).update(eq(1), any(CropCatalogDto.class));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/crop-catalogs/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropCatalog deleted successfully"));
		verify(cropCatalogService).delete(1);
	}

	@ParameterizedTest
	@ValueSource(ints = { 1, 2, 50, 999, 12345 })
	void getByIdWithVariousIds(int id) throws Exception {
		when(cropCatalogService.getById(id)).thenReturn(cropCatalog);

		mockMvc.perform(get("/crop-catalogs/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.cropName").value("Wheat"));
		verify(cropCatalogService).getById(id);
	}

	@ParameterizedTest
	@ValueSource(ints = { 1, 3, 77, 1001 })
	void deleteWithVariousIds(int id) throws Exception {
		mockMvc.perform(delete("/crop-catalogs/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropCatalog deleted successfully"));
		verify(cropCatalogService).delete(id);
	}

	@ParameterizedTest
	@ValueSource(ints = { 1, 4, 88, 2002 })
	void updateWithVariousIds(int id) throws Exception {
		when(cropCatalogService.update(eq(id), any(CropCatalogDto.class))).thenReturn(cropCatalog);

		mockMvc.perform(put("/crop-catalogs/" + id)
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CropCatalogDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("CropCatalog updated successfully"));
		verify(cropCatalogService).update(eq(id), any(CropCatalogDto.class));
	}
}

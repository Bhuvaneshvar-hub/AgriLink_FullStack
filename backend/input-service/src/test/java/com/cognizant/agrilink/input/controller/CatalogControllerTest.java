package com.cognizant.agrilink.input.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cognizant.agrilink.input.dto.CatalogDto;
import com.cognizant.agrilink.input.entity.Catalog;
import com.cognizant.agrilink.input.enums.Status;
import com.cognizant.agrilink.input.service.CatalogService;
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
class CatalogControllerTest {

	@Mock
	private CatalogService catalogService;

	@InjectMocks
	private CatalogController catalogController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private Catalog catalog;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(catalogController).build();
		catalog = Catalog.builder()
				.inputId(1)
				.name("Urea")
				.category("Fertiliser")
				.unit("Kg")
				.pricePerUnit(45.5)
				.subsidisedPrice(30.0)
				.availableStock(500)
				.status(Status.AC)
				.build();
	}

	@Test
	void getAllReturnsData() throws Exception {
		when(catalogService.getAll()).thenReturn(List.of(catalog));

		mockMvc.perform(get("/catalogs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].name").value("Urea"));
	}

	@Test
	void getByIdReturnsData() throws Exception {
		when(catalogService.getById(1)).thenReturn(catalog);

		mockMvc.perform(get("/catalogs/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.category").value("Fertiliser"));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(catalogService.create(any(CatalogDto.class))).thenReturn(catalog);

		mockMvc.perform(post("/catalogs")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CatalogDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Catalog created successfully"));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(catalogService.update(eq(1), any(CatalogDto.class))).thenReturn(catalog);

		mockMvc.perform(put("/catalogs/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CatalogDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Catalog updated successfully"));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/catalogs/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Catalog deleted successfully"));
	}
}

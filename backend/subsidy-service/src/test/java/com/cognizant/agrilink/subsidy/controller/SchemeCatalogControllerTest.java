package com.cognizant.agrilink.subsidy.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cognizant.agrilink.subsidy.dto.SchemeCatalogDto;
import com.cognizant.agrilink.subsidy.entity.SchemeCatalog;
import com.cognizant.agrilink.subsidy.enums.Status;
import com.cognizant.agrilink.subsidy.service.SchemeCatalogService;
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
class SchemeCatalogControllerTest {

	@Mock
	private SchemeCatalogService schemeCatalogService;

	@InjectMocks
	private SchemeCatalogController schemeCatalogController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private SchemeCatalog schemeCatalog;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(schemeCatalogController).build();
		schemeCatalog = SchemeCatalog.builder()
				.schemeId(1)
				.schemeName("PM Kisan")
				.category("DirectBenefit")
				.eligibilityCriteria("Small and marginal farmers")
				.benefitAmount(6000.0)
				.fundingSource("Central")
				.startDate(LocalDate.of(2026, 1, 1))
				.endDate(LocalDate.of(2026, 12, 31))
				.status(Status.AC)
				.build();
	}

	@Test
	void getAllReturnsData() throws Exception {
		when(schemeCatalogService.getAll()).thenReturn(List.of(schemeCatalog));

		mockMvc.perform(get("/agriLink/subsidyScheme/fetchSchemes"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].schemeName").value("PM Kisan"));
	}

	@Test
	void getByIdReturnsData() throws Exception {
		when(schemeCatalogService.getById(1)).thenReturn(schemeCatalog);

		mockMvc.perform(get("/agriLink/subsidyScheme/fetchSchemeById/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.category").value("DirectBenefit"));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(schemeCatalogService.create(any(SchemeCatalogDto.class))).thenReturn(schemeCatalog);

		mockMvc.perform(post("/agriLink/subsidyScheme/createScheme")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new SchemeCatalogDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Scheme created successfully"));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(schemeCatalogService.update(eq(1), any(SchemeCatalogDto.class))).thenReturn(schemeCatalog);

		mockMvc.perform(put("/agriLink/subsidyScheme/updateScheme/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new SchemeCatalogDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Scheme updated successfully"));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/agriLink/subsidyScheme/deleteScheme/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Scheme deleted successfully"));
	}
}

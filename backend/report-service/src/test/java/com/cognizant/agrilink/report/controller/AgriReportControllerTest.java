package com.cognizant.agrilink.report.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cognizant.agrilink.report.dto.AgriReportDto;
import com.cognizant.agrilink.report.entity.AgriReport;
import com.cognizant.agrilink.report.service.AgriReportService;
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
class AgriReportControllerTest {

	@Mock
	private AgriReportService agriReportService;

	@InjectMocks
	private AgriReportController agriReportController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private AgriReport agriReport;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(agriReportController).build();
		agriReport = AgriReport.builder()
				.reportId(1)
				.generatedBy(1)
				.scope("District")
				.metrics("YieldSummary")
				.generatedDate(LocalDate.of(2026, 6, 15))
				.build();
	}

	@Test
	void getAllReturnsData() throws Exception {
		when(agriReportService.getAll()).thenReturn(List.of(agriReport));

		mockMvc.perform(get("/agri-reports"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].scope").value("District"));
	}

	@Test
	void getByIdReturnsData() throws Exception {
		when(agriReportService.getById(1)).thenReturn(agriReport);

		mockMvc.perform(get("/agri-reports/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.metrics").value("YieldSummary"));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(agriReportService.create(any(AgriReportDto.class))).thenReturn(agriReport);

		mockMvc.perform(post("/agri-reports")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new AgriReportDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("AgriReport created successfully"));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(agriReportService.update(eq(1), any(AgriReportDto.class))).thenReturn(agriReport);

		mockMvc.perform(put("/agri-reports/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new AgriReportDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("AgriReport updated successfully"));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/agri-reports/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("AgriReport deleted successfully"));
	}
}

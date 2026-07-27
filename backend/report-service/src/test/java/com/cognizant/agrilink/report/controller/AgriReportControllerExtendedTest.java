package com.cognizant.agrilink.report.controller;

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

import com.cognizant.agrilink.report.dto.AgriReportDto;
import com.cognizant.agrilink.report.entity.AgriReport;
import com.cognizant.agrilink.report.service.AgriReportService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class AgriReportControllerExtendedTest {

	@Mock
	private AgriReportService agriReportService;

	@InjectMocks
	private AgriReportController agriReportController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(agriReportController).build();
	}

	private AgriReport report(Integer id, Integer generatedBy, String scope, String metrics, LocalDate date) {
		return AgriReport.builder()
				.reportId(id)
				.generatedBy(generatedBy)
				.scope(scope)
				.metrics(metrics)
				.generatedDate(date)
				.build();
	}

	// ---------- GET by id returns full data ----------

	@ParameterizedTest
	@CsvSource({
			"1, 10, District, RegisteredFarmers=1200, 2026-06-15",
			"2, 20, Crop, TotalAreaCovered=540, 2024-02-29",
			"3, 30, Season, EstimatedYield=3.2, 2030-12-31",
			"4, 40, Scheme, SubsidyDisbursed=50000, 1999-07-04",
			"5, 50, Region, IrrigationCoverage=80, 2020-01-01"
	})
	void getByIdReturnsFullData(int id, int generatedBy, String scope, String metrics, String date) throws Exception {
		when(agriReportService.getById(id)).thenReturn(report(id, generatedBy, scope, metrics, LocalDate.parse(date)));

		mockMvc.perform(get("/agri-reports/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.reportId").value(id))
				.andExpect(jsonPath("$.generatedBy").value(generatedBy))
				.andExpect(jsonPath("$.scope").value(scope))
				.andExpect(jsonPath("$.metrics").value(metrics))
				.andExpect(jsonPath("$.generatedDate").value(date));
	}

	@ParameterizedTest
	@ValueSource(strings = {"District", "Crop", "Season", "Scheme", "Region", "Block", "Village", "Mandal"})
	void getByIdReturnsScope(String scope) throws Exception {
		when(agriReportService.getById(1)).thenReturn(report(1, 1, scope, "m", LocalDate.of(2026, 6, 15)));

		mockMvc.perform(get("/agri-reports/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.scope").value(scope));
	}

	@ParameterizedTest
	@ValueSource(strings = {
			"RegisteredFarmers=1200",
			"TotalAreaCovered=540ha",
			"EstimatedYield=3.2t",
			"SubsidyDisbursed=50000",
			"IrrigationCoverage=80%"
	})
	void getByIdReturnsMetrics(String metrics) throws Exception {
		when(agriReportService.getById(1)).thenReturn(report(1, 1, "District", metrics, LocalDate.of(2026, 6, 15)));

		mockMvc.perform(get("/agri-reports/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.metrics").value(metrics));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 100, 999, 42})
	void getByIdInvokesServiceWithId(int id) throws Exception {
		when(agriReportService.getById(id)).thenReturn(report(id, 1, "District", "m", LocalDate.of(2026, 6, 15)));

		mockMvc.perform(get("/agri-reports/" + id))
				.andExpect(status().isOk());

		verify(agriReportService).getById(id);
	}

	// ---------- GET list ----------

	@ParameterizedTest
	@ValueSource(ints = {0, 1, 2, 5, 10})
	void getAllReturnsExpectedListSize(int count) throws Exception {
		List<AgriReport> records = new ArrayList<>();
		for (int i = 0; i < count; i++) {
			records.add(report(i, i, "District", "m" + i, LocalDate.of(2026, 6, 15)));
		}
		when(agriReportService.getAll()).thenReturn(records);

		mockMvc.perform(get("/agri-reports"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(count));
	}

	@ParameterizedTest
	@CsvSource({
			"District, RegisteredFarmers=1200",
			"Crop, TotalAreaCovered=540",
			"Season, EstimatedYield=3.2",
			"Scheme, SubsidyDisbursed=50000"
	})
	void getAllReturnsFirstRecordFullData(String scope, String metrics) throws Exception {
		when(agriReportService.getAll()).thenReturn(List.of(report(1, 7, scope, metrics, LocalDate.of(2026, 6, 15))));

		mockMvc.perform(get("/agri-reports"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].scope").value(scope))
				.andExpect(jsonPath("$[0].metrics").value(metrics))
				.andExpect(jsonPath("$[0].generatedBy").value(7));
	}

	@Test
	void getAllReturnsEmptyArray() throws Exception {
		when(agriReportService.getAll()).thenReturn(new ArrayList<>());

		mockMvc.perform(get("/agri-reports"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	void getAllInvokesService() throws Exception {
		when(agriReportService.getAll()).thenReturn(new ArrayList<>());

		mockMvc.perform(get("/agri-reports"))
				.andExpect(status().isOk());

		verify(agriReportService, times(1)).getAll();
	}

	// ---------- POST returns message only ----------

	@ParameterizedTest
	@MethodSource("bodies")
	void createReturnsMessageOnly(AgriReportDto body) throws Exception {
		when(agriReportService.create(any(AgriReportDto.class)))
				.thenReturn(report(1, 1, "District", "m", LocalDate.of(2026, 6, 15)));

		mockMvc.perform(post("/agri-reports")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("AgriReport created successfully"))
				.andExpect(jsonPath("$.reportId").doesNotExist())
				.andExpect(jsonPath("$.scope").doesNotExist())
				.andExpect(jsonPath("$.metrics").doesNotExist())
				.andExpect(jsonPath("$.generatedBy").doesNotExist())
				.andExpect(jsonPath("$.generatedDate").doesNotExist());
	}

	static Stream<AgriReportDto> bodies() {
		return Stream.of(
				AgriReportDto.builder().generatedBy(1).scope("District").metrics("RegisteredFarmers=1200").build(),
				AgriReportDto.builder().generatedBy(0).scope("Crop").metrics("TotalAreaCovered=540").build(),
				AgriReportDto.builder().generatedBy(-1).scope("Season").metrics("EstimatedYield=3.2").build(),
				AgriReportDto.builder().generatedBy(999999).scope("Scheme").metrics("SubsidyDisbursed=50000").build(),
				AgriReportDto.builder().build()
		);
	}

	@ParameterizedTest
	@ValueSource(strings = {"District", "Crop", "Season", "Scheme", "Region"})
	void createInvokesServiceForEachScope(String scope) throws Exception {
		when(agriReportService.create(any(AgriReportDto.class)))
				.thenReturn(report(1, 1, scope, "m", LocalDate.of(2026, 6, 15)));

		mockMvc.perform(post("/agri-reports")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(
								AgriReportDto.builder().scope(scope).build())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("AgriReport created successfully"));

		verify(agriReportService).create(any(AgriReportDto.class));
	}

	// ---------- PUT returns message only ----------

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 100, 999, 42})
	void updateReturnsMessageOnly(int id) throws Exception {
		when(agriReportService.update(eq(id), any(AgriReportDto.class)))
				.thenReturn(report(id, 1, "District", "m", LocalDate.of(2026, 6, 15)));

		mockMvc.perform(put("/agri-reports/" + id)
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(
								AgriReportDto.builder().scope("District").build())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("AgriReport updated successfully"))
				.andExpect(jsonPath("$.reportId").doesNotExist())
				.andExpect(jsonPath("$.scope").doesNotExist())
				.andExpect(jsonPath("$.metrics").doesNotExist())
				.andExpect(jsonPath("$.generatedBy").doesNotExist())
				.andExpect(jsonPath("$.generatedDate").doesNotExist());
	}

	@ParameterizedTest
	@CsvSource({
			"1, District",
			"2, Crop",
			"3, Season",
			"4, Scheme"
	})
	void updateInvokesServiceWithId(int id, String scope) throws Exception {
		when(agriReportService.update(eq(id), any(AgriReportDto.class)))
				.thenReturn(report(id, 1, scope, "m", LocalDate.of(2026, 6, 15)));

		mockMvc.perform(put("/agri-reports/" + id)
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(
								AgriReportDto.builder().scope(scope).build())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("AgriReport updated successfully"));

		verify(agriReportService).update(eq(id), any(AgriReportDto.class));
	}

	// ---------- DELETE returns message only ----------

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 100, 999, 42, 7})
	void deleteReturnsMessageOnly(int id) throws Exception {
		mockMvc.perform(delete("/agri-reports/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("AgriReport deleted successfully"))
				.andExpect(jsonPath("$.reportId").doesNotExist())
				.andExpect(jsonPath("$.scope").doesNotExist())
				.andExpect(jsonPath("$.metrics").doesNotExist())
				.andExpect(jsonPath("$.generatedBy").doesNotExist())
				.andExpect(jsonPath("$.generatedDate").doesNotExist());
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 5, 12345})
	void deleteInvokesServiceWithId(int id) throws Exception {
		mockMvc.perform(delete("/agri-reports/" + id))
				.andExpect(status().isOk());

		verify(agriReportService, times(1)).delete(id);
	}
}

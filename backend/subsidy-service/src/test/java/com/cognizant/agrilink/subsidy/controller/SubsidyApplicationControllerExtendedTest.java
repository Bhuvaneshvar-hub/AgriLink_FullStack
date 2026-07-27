package com.cognizant.agrilink.subsidy.controller;

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

import com.cognizant.agrilink.subsidy.dto.SubsidyApplicationDto;
import com.cognizant.agrilink.subsidy.entity.SubsidyApplication;
import com.cognizant.agrilink.subsidy.enums.ApplicationStatus;
import com.cognizant.agrilink.subsidy.service.SubsidyApplicationService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class SubsidyApplicationControllerExtendedTest {

	@Mock
	private SubsidyApplicationService subsidyApplicationService;

	@InjectMocks
	private SubsidyApplicationController subsidyApplicationController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

	private SubsidyApplication subsidyApplication;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(subsidyApplicationController).build();
		subsidyApplication = SubsidyApplication.builder()
				.applicationId(1)
				.farmerId(1)
				.schemeId(1)
				.applicationDate(LocalDate.of(2026, 2, 1))
				.eligibilityScore(85.5)
				.reviewedBy(2)
				.disbursedAmount(6000.0)
				.disbursedDate(LocalDate.of(2026, 3, 1))
				.status(ApplicationStatus.AP)
				.build();
	}

	@Test
	void getByIdReturnsAllFields() throws Exception {
		when(subsidyApplicationService.getById(1)).thenReturn(subsidyApplication);

		mockMvc.perform(get("/agriLink/subsidyScheme/fetchApplicationById/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.applicationId").value(1))
				.andExpect(jsonPath("$.farmerId").value(1))
				.andExpect(jsonPath("$.schemeId").value(1))
				.andExpect(jsonPath("$.applicationDate").value("2026-02-01"))
				.andExpect(jsonPath("$.eligibilityScore").value(85.5))
				.andExpect(jsonPath("$.reviewedBy").value(2))
				.andExpect(jsonPath("$.disbursedAmount").value(6000.0))
				.andExpect(jsonPath("$.disbursedDate").value("2026-03-01"))
				.andExpect(jsonPath("$.status").value("AP"));
	}

	@Test
	void getAllReturnsAllFields() throws Exception {
		when(subsidyApplicationService.getAll()).thenReturn(List.of(subsidyApplication));

		mockMvc.perform(get("/agriLink/subsidyScheme/fetchApplications"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].applicationId").value(1))
				.andExpect(jsonPath("$[0].farmerId").value(1))
				.andExpect(jsonPath("$[0].eligibilityScore").value(85.5))
				.andExpect(jsonPath("$[0].disbursedAmount").value(6000.0))
				.andExpect(jsonPath("$[0].status").value("AP"));
	}

	@Test
	void getAllEmptyReturnsEmptyArray() throws Exception {
		when(subsidyApplicationService.getAll()).thenReturn(List.of());

		mockMvc.perform(get("/agriLink/subsidyScheme/fetchApplications"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isArray())
				.andExpect(jsonPath("$").isEmpty());
	}

	@Test
	void getAllManyReturnsAll() throws Exception {
		when(subsidyApplicationService.getAll())
				.thenReturn(List.of(subsidyApplication, subsidyApplication, subsidyApplication));

		mockMvc.perform(get("/agriLink/subsidyScheme/fetchApplications"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(3));
	}

	@ParameterizedTest
	@EnumSource(ApplicationStatus.class)
	void getByIdReturnsVariousStatuses(ApplicationStatus statusValue) throws Exception {
		subsidyApplication.setStatus(statusValue);
		when(subsidyApplicationService.getById(1)).thenReturn(subsidyApplication);

		mockMvc.perform(get("/agriLink/subsidyScheme/fetchApplicationById/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value(statusValue.name()));
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 50.0, 99.99, 100.0})
	void getByIdReturnsVariousEligibilityScores(double score) throws Exception {
		subsidyApplication.setEligibilityScore(score);
		when(subsidyApplicationService.getById(1)).thenReturn(subsidyApplication);

		mockMvc.perform(get("/agriLink/subsidyScheme/fetchApplicationById/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.eligibilityScore").value(score));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 100, 9999})
	void getByIdReturnsVariousFarmerIds(int farmerId) throws Exception {
		subsidyApplication.setFarmerId(farmerId);
		when(subsidyApplicationService.getById(1)).thenReturn(subsidyApplication);

		mockMvc.perform(get("/agriLink/subsidyScheme/fetchApplicationById/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.farmerId").value(farmerId));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 5, 50, 9999})
	void getByIdWithVariousIds(int id) throws Exception {
		subsidyApplication.setApplicationId(id);
		when(subsidyApplicationService.getById(id)).thenReturn(subsidyApplication);

		mockMvc.perform(get("/agriLink/subsidyScheme/fetchApplicationById/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.applicationId").value(id));
	}

	@Test
	void createReturnsMessageOnlyAndNoEntityFields() throws Exception {
		when(subsidyApplicationService.create(any(SubsidyApplicationDto.class))).thenReturn(subsidyApplication);

		mockMvc.perform(post("/agriLink/subsidyScheme/createApplication")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new SubsidyApplicationDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("SubsidyApplication created successfully"))
				.andExpect(jsonPath("$.applicationId").doesNotExist())
				.andExpect(jsonPath("$.farmerId").doesNotExist())
				.andExpect(jsonPath("$.eligibilityScore").doesNotExist())
				.andExpect(jsonPath("$.disbursedAmount").doesNotExist())
				.andExpect(jsonPath("$.status").doesNotExist());
	}

	@Test
	void createInvokesServiceCreate() throws Exception {
		when(subsidyApplicationService.create(any(SubsidyApplicationDto.class))).thenReturn(subsidyApplication);

		mockMvc.perform(post("/agriLink/subsidyScheme/createApplication")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new SubsidyApplicationDto())))
				.andExpect(status().isOk());

		verify(subsidyApplicationService).create(any(SubsidyApplicationDto.class));
	}

	@Test
	void updateReturnsMessageOnlyAndNoEntityFields() throws Exception {
		when(subsidyApplicationService.update(eq(1), any(SubsidyApplicationDto.class))).thenReturn(subsidyApplication);

		mockMvc.perform(put("/agriLink/subsidyScheme/updateApplication/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new SubsidyApplicationDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("SubsidyApplication updated successfully"))
				.andExpect(jsonPath("$.applicationId").doesNotExist())
				.andExpect(jsonPath("$.farmerId").doesNotExist())
				.andExpect(jsonPath("$.status").doesNotExist());
	}

	@Test
	void updateInvokesServiceUpdate() throws Exception {
		when(subsidyApplicationService.update(eq(1), any(SubsidyApplicationDto.class))).thenReturn(subsidyApplication);

		mockMvc.perform(put("/agriLink/subsidyScheme/updateApplication/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new SubsidyApplicationDto())))
				.andExpect(status().isOk());

		verify(subsidyApplicationService).update(eq(1), any(SubsidyApplicationDto.class));
	}

	@Test
	void deleteReturnsMessageOnlyAndNoEntityFields() throws Exception {
		mockMvc.perform(delete("/agriLink/subsidyScheme/deleteApplication/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("SubsidyApplication deleted successfully"))
				.andExpect(jsonPath("$.applicationId").doesNotExist())
				.andExpect(jsonPath("$.farmerId").doesNotExist());
	}

	@Test
	void deleteInvokesServiceDelete() throws Exception {
		mockMvc.perform(delete("/agriLink/subsidyScheme/deleteApplication/1"))
				.andExpect(status().isOk());

		verify(subsidyApplicationService).delete(1);
	}

	@ParameterizedTest
	@CsvSource({
		"1,SubsidyApplication deleted successfully",
		"5,SubsidyApplication deleted successfully",
		"99,SubsidyApplication deleted successfully"
	})
	void deleteVariousIdsReturnsMessage(int id, String message) throws Exception {
		mockMvc.perform(delete("/agriLink/subsidyScheme/deleteApplication/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value(message));

		verify(subsidyApplicationService).delete(id);
	}
}

package com.cognizant.agrilink.input.controller;

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

import com.cognizant.agrilink.input.dto.RequestDto;
import com.cognizant.agrilink.input.entity.Request;
import com.cognizant.agrilink.input.enums.RequestStatus;
import com.cognizant.agrilink.input.service.RequestService;
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
class RequestControllerExtendedTest {

	@Mock
	private RequestService requestService;

	@InjectMocks
	private RequestController requestController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(requestController).build();
	}

	private Request buildRequest() {
		return Request.builder()
				.requestId(1)
				.farmerId(1)
				.inputId(10)
				.quantityRequested(50)
				.requestDate(LocalDate.of(2026, 6, 15))
				.assignedCentreId(5)
				.actualPrice(1500.0)
				.status(RequestStatus.PE)
				.build();
	}

	@Test
	void getByIdReturnsAllFields() throws Exception {
		when(requestService.getById(1)).thenReturn(buildRequest());

		mockMvc.perform(get("/requests/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.requestId").value(1))
				.andExpect(jsonPath("$.farmerId").value(1))
				.andExpect(jsonPath("$.inputId").value(10))
				.andExpect(jsonPath("$.quantityRequested").value(50))
				.andExpect(jsonPath("$.requestDate").value("2026-06-15"))
				.andExpect(jsonPath("$.assignedCentreId").value(5))
				.andExpect(jsonPath("$.actualPrice").value(1500.0))
				.andExpect(jsonPath("$.status").value("PE"));
		verify(requestService).getById(1);
	}

	@Test
	void getAllReturnsAllFields() throws Exception {
		when(requestService.getAll()).thenReturn(List.of(buildRequest()));

		mockMvc.perform(get("/requests"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].requestId").value(1))
				.andExpect(jsonPath("$[0].farmerId").value(1))
				.andExpect(jsonPath("$[0].inputId").value(10))
				.andExpect(jsonPath("$[0].quantityRequested").value(50))
				.andExpect(jsonPath("$[0].requestDate").value("2026-06-15"))
				.andExpect(jsonPath("$[0].assignedCentreId").value(5))
				.andExpect(jsonPath("$[0].actualPrice").value(1500.0))
				.andExpect(jsonPath("$[0].status").value("PE"));
	}

	@Test
	void getAllReturnsEmptyList() throws Exception {
		when(requestService.getAll()).thenReturn(List.of());

		mockMvc.perform(get("/requests"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isEmpty());
	}

	@Test
	void getAllReturnsManyRecords() throws Exception {
		when(requestService.getAll()).thenReturn(List.of(
				Request.builder().requestId(1).status(RequestStatus.PE).build(),
				Request.builder().requestId(2).status(RequestStatus.AP).build(),
				Request.builder().requestId(3).status(RequestStatus.DL).build()));

		mockMvc.perform(get("/requests"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(3))
				.andExpect(jsonPath("$[2].status").value("DL"));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 50, 999, 100000})
	void getByIdForVariousIds(int id) throws Exception {
		Request request = Request.builder().requestId(id).status(RequestStatus.PE).build();
		when(requestService.getById(id)).thenReturn(request);

		mockMvc.perform(get("/requests/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.requestId").value(id));
		verify(requestService).getById(id);
	}

	@ParameterizedTest
	@EnumSource(RequestStatus.class)
	void getByIdReflectsStatus(RequestStatus statusValue) throws Exception {
		Request request = buildRequest();
		request.setStatus(statusValue);
		when(requestService.getById(1)).thenReturn(request);

		mockMvc.perform(get("/requests/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value(statusValue.name()));
	}

	@ParameterizedTest
	@ValueSource(ints = {0, 1, 50, 999, 100000})
	void getByIdReflectsQuantity(int quantity) throws Exception {
		Request request = buildRequest();
		request.setQuantityRequested(quantity);
		when(requestService.getById(1)).thenReturn(request);

		mockMvc.perform(get("/requests/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.quantityRequested").value(quantity));
	}

	@ParameterizedTest
	@CsvSource({
			"2020-01-01",
			"2024-02-29",
			"2026-06-15",
			"2030-12-31"
	})
	void getByIdReflectsDate(String date) throws Exception {
		Request request = buildRequest();
		request.setRequestDate(LocalDate.parse(date));
		when(requestService.getById(1)).thenReturn(request);

		mockMvc.perform(get("/requests/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.requestDate").value(date));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(requestService.create(any(RequestDto.class))).thenReturn(buildRequest());

		mockMvc.perform(post("/requests")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new RequestDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Request created successfully"))
				.andExpect(jsonPath("$.status").doesNotExist());
		verify(requestService).create(any(RequestDto.class));
	}

	@ParameterizedTest
	@CsvSource({
			"1,10,50,PE",
			"2,20,75,AP",
			"3,30,100,AP",
			"4,40,5,RE"
	})
	void createWithVariousPayloads(int farmerId, int inputId, int quantity, RequestStatus status) throws Exception {
		when(requestService.create(any(RequestDto.class))).thenReturn(buildRequest());
		RequestDto dto = RequestDto.builder()
				.farmerId(farmerId)
				.inputId(inputId)
				.quantityRequested(quantity)
				.status(status)
				.build();

		mockMvc.perform(post("/requests")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(dto)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Request created successfully"));
		verify(requestService).create(any(RequestDto.class));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(requestService.update(eq(1), any(RequestDto.class))).thenReturn(buildRequest());

		mockMvc.perform(put("/requests/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new RequestDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Request updated successfully"))
				.andExpect(jsonPath("$.status").doesNotExist());
		verify(requestService).update(eq(1), any(RequestDto.class));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 50, 999})
	void updateForVariousIds(int id) throws Exception {
		when(requestService.update(eq(id), any(RequestDto.class))).thenReturn(buildRequest());

		mockMvc.perform(put("/requests/" + id)
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new RequestDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Request updated successfully"));
		verify(requestService).update(eq(id), any(RequestDto.class));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/requests/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Request deleted successfully"));
		verify(requestService).delete(1);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 50, 999})
	void deleteForVariousIds(int id) throws Exception {
		mockMvc.perform(delete("/requests/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Request deleted successfully"));
		verify(requestService).delete(id);
	}
}

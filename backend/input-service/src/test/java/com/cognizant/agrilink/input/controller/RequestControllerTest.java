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

import com.cognizant.agrilink.input.dto.RequestDto;
import com.cognizant.agrilink.input.entity.Request;
import com.cognizant.agrilink.input.enums.RequestStatus;
import com.cognizant.agrilink.input.service.RequestService;
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
class RequestControllerTest {

	@Mock
	private RequestService requestService;

	@InjectMocks
	private RequestController requestController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private Request request;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(requestController).build();
		request = Request.builder()
				.requestId(1)
				.farmerId(1)
				.inputId(10)
				.quantityRequested(50)
				.assignedCentreId(5)
				.actualPrice(1500.0)
				.status(RequestStatus.PE)
				.build();
	}

	@Test
	void getAllReturnsData() throws Exception {
		when(requestService.getAll()).thenReturn(List.of(request));

		mockMvc.perform(get("/requests"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].status").value("PE"));
	}

	@Test
	void getByIdReturnsData() throws Exception {
		when(requestService.getById(1)).thenReturn(request);

		mockMvc.perform(get("/requests/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.quantityRequested").value(50));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(requestService.create(any(RequestDto.class))).thenReturn(request);

		mockMvc.perform(post("/requests")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new RequestDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Request created successfully"));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(requestService.update(eq(1), any(RequestDto.class))).thenReturn(request);

		mockMvc.perform(put("/requests/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new RequestDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Request updated successfully"));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/requests/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Request deleted successfully"));
	}
}

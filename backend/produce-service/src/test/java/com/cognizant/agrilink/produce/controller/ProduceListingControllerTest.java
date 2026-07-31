package com.cognizant.agrilink.produce.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cognizant.agrilink.produce.client.FarmerClient;
import com.cognizant.agrilink.produce.dto.ProduceListingDto;
import com.cognizant.agrilink.produce.entity.ProduceListing;
import com.cognizant.agrilink.produce.enums.ListingStatus;
import com.cognizant.agrilink.produce.service.ProduceListingService;
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
class ProduceListingControllerTest {

	@Mock
	private ProduceListingService produceListingService;

	@Mock
	private FarmerClient farmerClient;

	@InjectMocks
	private ProduceListingController produceListingController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private ProduceListing produceListing;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(produceListingController).build();
		produceListing = ProduceListing.builder()
				.listingId(1)
				.farmerId(1)
				.cropId(1)
				.harvestDate(LocalDate.of(2026, 6, 15))
				.quantityKg(500.0)
				.qualityGrade("A")
				.askingPricePerKg(25.5)
				.status(ListingStatus.AV)
				.build();
	}

	@Test
	void getAllReturnsData() throws Exception {
		when(produceListingService.getAll()).thenReturn(List.of(produceListing));

		mockMvc.perform(get("/produce-listings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].qualityGrade").value("A"));
	}

	@Test
	void getByIdReturnsData() throws Exception {
		when(produceListingService.getById(1)).thenReturn(produceListing);

		mockMvc.perform(get("/produce-listings/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value("AV"));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(produceListingService.create(any(ProduceListingDto.class))).thenReturn(produceListing);

		mockMvc.perform(post("/produce-listings")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new ProduceListingDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceListing created successfully"));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(produceListingService.update(eq(1), any(ProduceListingDto.class))).thenReturn(produceListing);

		mockMvc.perform(put("/produce-listings/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new ProduceListingDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceListing updated successfully"));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/produce-listings/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceListing deleted successfully"));
	}
}

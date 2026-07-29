package com.cognizant.agrilink.produce.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.cognizant.agrilink.produce.dto.ProduceListingDto;
import com.cognizant.agrilink.produce.entity.ProduceListing;
import com.cognizant.agrilink.produce.enums.ListingStatus;
import com.cognizant.agrilink.produce.service.ProduceListingService;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class ProduceListingControllerExtendedTest {

	@Mock
	private ProduceListingService produceListingService;

	@InjectMocks
	private ProduceListingController produceListingController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

	private ProduceListing produceListing;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(produceListingController).build();
		produceListing = ProduceListing.builder()
				.listingId(1)
				.farmerId(2)
				.cropId(3)
				.harvestDate(LocalDate.of(2026, 6, 15))
				.quantityKg(500.0)
				.qualityGrade("A")
				.askingPricePerKg(25.5)
				.status(ListingStatus.AV)
				.build();
	}

	@Test
	void getAllReturnsFullDataForEachField() throws Exception {
		when(produceListingService.getAll()).thenReturn(List.of(produceListing));

		mockMvc.perform(get("/produce-listings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].listingId").value(1))
				.andExpect(jsonPath("$[0].farmerId").value(2))
				.andExpect(jsonPath("$[0].cropId").value(3))
				.andExpect(jsonPath("$[0].harvestDate").value("2026-06-15"))
				.andExpect(jsonPath("$[0].quantityKg").value(500.0))
				.andExpect(jsonPath("$[0].qualityGrade").value("A"))
				.andExpect(jsonPath("$[0].askingPricePerKg").value(25.5))
				.andExpect(jsonPath("$[0].status").value("AV"));
		verify(produceListingService).getAll();
	}

	@Test
	void getAllReturnsEmptyArray() throws Exception {
		when(produceListingService.getAll()).thenReturn(Collections.emptyList());

		mockMvc.perform(get("/produce-listings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isArray())
				.andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	void getAllReturnsManyRecords() throws Exception {
		when(produceListingService.getAll())
				.thenReturn(List.of(produceListing, produceListing, produceListing));

		mockMvc.perform(get("/produce-listings"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(3));
	}

	@Test
	void getByIdReturnsFullDataForEachField() throws Exception {
		when(produceListingService.getById(1)).thenReturn(produceListing);

		mockMvc.perform(get("/produce-listings/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.listingId").value(1))
				.andExpect(jsonPath("$.farmerId").value(2))
				.andExpect(jsonPath("$.cropId").value(3))
				.andExpect(jsonPath("$.harvestDate").value("2026-06-15"))
				.andExpect(jsonPath("$.quantityKg").value(500.0))
				.andExpect(jsonPath("$.qualityGrade").value("A"))
				.andExpect(jsonPath("$.askingPricePerKg").value(25.5))
				.andExpect(jsonPath("$.status").value("AV"));
		verify(produceListingService).getById(1);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 50, 999, 123456})
	void getByIdQueriesVariousIds(int id) throws Exception {
		produceListing.setListingId(id);
		when(produceListingService.getById(id)).thenReturn(produceListing);

		mockMvc.perform(get("/produce-listings/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.listingId").value(id));
		verify(produceListingService).getById(id);
	}

	@ParameterizedTest
	@ValueSource(strings = {"A", "B", "C"})
	void getByIdReturnsEachQualityGrade(String grade) throws Exception {
		produceListing.setQualityGrade(grade);
		when(produceListingService.getById(1)).thenReturn(produceListing);

		mockMvc.perform(get("/produce-listings/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.qualityGrade").value(grade));
	}

	@ParameterizedTest
	@EnumSource(ListingStatus.class)
	void getByIdReturnsEachStatus(ListingStatus statusValue) throws Exception {
		produceListing.setStatus(statusValue);
		when(produceListingService.getById(1)).thenReturn(produceListing);

		mockMvc.perform(get("/produce-listings/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value(statusValue.name()));
	}

	@Test
	void createReturnsMessageOnlyAndNoEntityFields() throws Exception {
		when(produceListingService.create(any(ProduceListingDto.class))).thenReturn(produceListing);

		ProduceListingDto body = ProduceListingDto.builder()
				.farmerId(2)
				.cropId(3)
				.quantityKg(500.0)
				.qualityGrade("A")
				.askingPricePerKg(25.5)
				.status(ListingStatus.AV)
				.build();

		mockMvc.perform(post("/produce-listings")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceListing created successfully"))
				.andExpect(jsonPath("$.listingId").doesNotExist())
				.andExpect(jsonPath("$.qualityGrade").doesNotExist())
				.andExpect(jsonPath("$.status").doesNotExist());
		verify(produceListingService).create(any(ProduceListingDto.class));
	}

	@Test
	void createInvokesServiceOnce() throws Exception {
		when(produceListingService.create(any(ProduceListingDto.class))).thenReturn(produceListing);

		mockMvc.perform(post("/produce-listings")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new ProduceListingDto())))
				.andExpect(status().isOk());
		verify(produceListingService).create(any(ProduceListingDto.class));
	}

	@Test
	void updateReturnsMessageOnlyAndNoEntityFields() throws Exception {
		when(produceListingService.update(eq(1), any(ProduceListingDto.class))).thenReturn(produceListing);

		ProduceListingDto body = ProduceListingDto.builder()
				.farmerId(2)
				.cropId(3)
				.quantityKg(500.0)
				.qualityGrade("A")
				.askingPricePerKg(25.5)
				.status(ListingStatus.AV)
				.build();

		mockMvc.perform(put("/produce-listings/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceListing updated successfully"))
				.andExpect(jsonPath("$.listingId").doesNotExist())
				.andExpect(jsonPath("$.qualityGrade").doesNotExist())
				.andExpect(jsonPath("$.status").doesNotExist());
		verify(produceListingService).update(eq(1), any(ProduceListingDto.class));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 7, 999})
	void updateInvokesServiceWithPathId(int id) throws Exception {
		when(produceListingService.update(eq(id), any(ProduceListingDto.class))).thenReturn(produceListing);

		mockMvc.perform(put("/produce-listings/" + id)
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new ProduceListingDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceListing updated successfully"));
		verify(produceListingService).update(eq(id), any(ProduceListingDto.class));
	}

	@Test
	void deleteReturnsMessageOnlyAndNoEntityFields() throws Exception {
		mockMvc.perform(delete("/produce-listings/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceListing deleted successfully"))
				.andExpect(jsonPath("$.listingId").doesNotExist())
				.andExpect(jsonPath("$.status").doesNotExist());
		verify(produceListingService).delete(1);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 7, 999})
	void deleteInvokesServiceWithPathId(int id) throws Exception {
		mockMvc.perform(delete("/produce-listings/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceListing deleted successfully"));
		verify(produceListingService).delete(id);
	}

	@Test
	void deleteNeverInvokesGetAll() throws Exception {
		mockMvc.perform(delete("/produce-listings/1"))
				.andExpect(status().isOk());
		verify(produceListingService, never()).getAll();
	}
}

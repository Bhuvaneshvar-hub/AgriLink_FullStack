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

import com.cognizant.agrilink.produce.dto.ProduceSaleDto;
import com.cognizant.agrilink.produce.entity.ProduceSale;
import com.cognizant.agrilink.produce.enums.PaymentStatus;
import com.cognizant.agrilink.produce.client.FarmerClient;
import com.cognizant.agrilink.produce.service.ProduceSaleService;
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
class ProduceSaleControllerTest {

	@Mock
	private ProduceSaleService produceSaleService;

	@Mock
	private FarmerClient farmerClient;

	@InjectMocks
	private ProduceSaleController produceSaleController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	private ProduceSale produceSale;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(produceSaleController).build();
		produceSale = ProduceSale.builder()
				.saleId(1)
				.listingId(1)
				.buyerId(1)
				.quantitySoldKg(300.0)
				.agreedPricePerKg(24.0)
				.totalAmount(7200.0)
				.saleDate(LocalDate.of(2026, 6, 15))
				.paymentStatus(PaymentStatus.PD)
				.build();
	}

	@Test
	void getAllReturnsData() throws Exception {
		when(produceSaleService.getAll()).thenReturn(List.of(produceSale));

		mockMvc.perform(get("/produce-sales"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].paymentStatus").value("PD"));
	}

	@Test
	void getByIdReturnsData() throws Exception {
		when(produceSaleService.getById(1)).thenReturn(produceSale);

		mockMvc.perform(get("/produce-sales/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.paymentStatus").value("PD"));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(produceSaleService.create(any(ProduceSaleDto.class))).thenReturn(produceSale);

		mockMvc.perform(post("/produce-sales")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new ProduceSaleDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceSale created successfully"));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(produceSaleService.update(eq(1), any(ProduceSaleDto.class))).thenReturn(produceSale);

		mockMvc.perform(put("/produce-sales/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new ProduceSaleDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceSale updated successfully"));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/produce-sales/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceSale deleted successfully"));
	}
}

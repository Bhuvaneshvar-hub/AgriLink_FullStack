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

import com.cognizant.agrilink.produce.client.FarmerClient;
import com.cognizant.agrilink.produce.notification.NotificationClient;
import com.cognizant.agrilink.produce.dto.ProduceSaleDto;
import com.cognizant.agrilink.produce.entity.ProduceSale;
import com.cognizant.agrilink.produce.enums.PaymentStatus;
import com.cognizant.agrilink.produce.exception.GlobalExceptionHandler;
import com.cognizant.agrilink.produce.service.ProduceSaleService;
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
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@ExtendWith(MockitoExtension.class)
class ProduceSaleControllerExtendedTest {

	@Mock
	private ProduceSaleService produceSaleService;

	@Mock
	private FarmerClient farmerClient;

	@Mock
	private NotificationClient notificationClient;

	@InjectMocks
	private ProduceSaleController produceSaleController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper().findAndRegisterModules();

	private ProduceSale produceSale;

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(produceSaleController)
				.setControllerAdvice(new GlobalExceptionHandler())
				.build();
		produceSale = ProduceSale.builder()
				.saleId(1)
				.listingId(2)
				.buyerId(3)
				.quantitySoldKg(300.0)
				.agreedPricePerKg(24.0)
				.totalAmount(7200.0)
				.saleDate(LocalDate.of(2026, 6, 15))
				.paymentStatus(PaymentStatus.PD)
				.build();
	}

	@Test
	void getAllReturnsFullDataForEachField() throws Exception {
		when(produceSaleService.getAll()).thenReturn(List.of(produceSale));

		mockMvc.perform(get("/produce-sales"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].saleId").value(1))
				.andExpect(jsonPath("$[0].listingId").value(2))
				.andExpect(jsonPath("$[0].buyerId").value(3))
				.andExpect(jsonPath("$[0].quantitySoldKg").value(300.0))
				.andExpect(jsonPath("$[0].agreedPricePerKg").value(24.0))
				.andExpect(jsonPath("$[0].totalAmount").value(7200.0))
				.andExpect(jsonPath("$[0].saleDate").value("2026-06-15"))
				.andExpect(jsonPath("$[0].paymentStatus").value("PD"));
		verify(produceSaleService).getAll();
	}

	@Test
	void getAllReturnsEmptyArray() throws Exception {
		when(produceSaleService.getAll()).thenReturn(Collections.emptyList());

		mockMvc.perform(get("/produce-sales"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isArray())
				.andExpect(jsonPath("$.length()").value(0));
	}

	@Test
	void getAllReturnsManyRecords() throws Exception {
		when(produceSaleService.getAll())
				.thenReturn(List.of(produceSale, produceSale, produceSale));

		mockMvc.perform(get("/produce-sales"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(3));
	}

	@Test
	void getByIdReturnsFullDataForEachField() throws Exception {
		when(produceSaleService.getById(1)).thenReturn(produceSale);

		mockMvc.perform(get("/produce-sales/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.saleId").value(1))
				.andExpect(jsonPath("$.listingId").value(2))
				.andExpect(jsonPath("$.buyerId").value(3))
				.andExpect(jsonPath("$.quantitySoldKg").value(300.0))
				.andExpect(jsonPath("$.agreedPricePerKg").value(24.0))
				.andExpect(jsonPath("$.totalAmount").value(7200.0))
				.andExpect(jsonPath("$.saleDate").value("2026-06-15"))
				.andExpect(jsonPath("$.paymentStatus").value("PD"));
		verify(produceSaleService).getById(1);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 50, 999, 123456})
	void getByIdQueriesVariousIds(int id) throws Exception {
		produceSale.setSaleId(id);
		when(produceSaleService.getById(id)).thenReturn(produceSale);

		mockMvc.perform(get("/produce-sales/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.saleId").value(id));
		verify(produceSaleService).getById(id);
	}

	@ParameterizedTest
	@EnumSource(PaymentStatus.class)
	void getByIdReturnsEachPaymentStatus(PaymentStatus paymentStatus) throws Exception {
		produceSale.setPaymentStatus(paymentStatus);
		when(produceSaleService.getById(1)).thenReturn(produceSale);

		mockMvc.perform(get("/produce-sales/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.paymentStatus").value(paymentStatus.name()));
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 100.0, 7200.0, 1000000.0})
	void getByIdReturnsVariousTotalAmounts(double amount) throws Exception {
		produceSale.setTotalAmount(amount);
		when(produceSaleService.getById(1)).thenReturn(produceSale);

		mockMvc.perform(get("/produce-sales/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.totalAmount").value(amount));
	}

	@Test
	void createReturnsMessageOnlyAndNoEntityFields() throws Exception {
		when(produceSaleService.create(any(ProduceSaleDto.class))).thenReturn(produceSale);

		ProduceSaleDto body = ProduceSaleDto.builder()
				.listingId(2)
				.buyerId(3)
				.quantitySoldKg(300.0)
				.agreedPricePerKg(24.0)
				.totalAmount(7200.0)
				.paymentStatus(PaymentStatus.PD)
				.build();

		mockMvc.perform(post("/produce-sales")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceSale created successfully"))
				.andExpect(jsonPath("$.saleId").doesNotExist())
				.andExpect(jsonPath("$.paymentStatus").doesNotExist())
				.andExpect(jsonPath("$.totalAmount").doesNotExist());
		verify(produceSaleService).create(any(ProduceSaleDto.class));
	}

	@Test
	void createInvokesServiceOnce() throws Exception {
		when(produceSaleService.create(any(ProduceSaleDto.class))).thenReturn(produceSale);

		mockMvc.perform(post("/produce-sales")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new ProduceSaleDto())))
				.andExpect(status().isOk());
		verify(produceSaleService).create(any(ProduceSaleDto.class));
	}

	@Test
	void updateReturnsMessageOnlyAndNoEntityFields() throws Exception {
		when(produceSaleService.update(eq(1), any(ProduceSaleDto.class))).thenReturn(produceSale);

		ProduceSaleDto body = ProduceSaleDto.builder()
				.listingId(2)
				.buyerId(3)
				.quantitySoldKg(300.0)
				.agreedPricePerKg(24.0)
				.totalAmount(7200.0)
				.paymentStatus(PaymentStatus.PD)
				.build();

		mockMvc.perform(put("/produce-sales/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(body)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceSale updated successfully"))
				.andExpect(jsonPath("$.saleId").doesNotExist())
				.andExpect(jsonPath("$.paymentStatus").doesNotExist())
				.andExpect(jsonPath("$.totalAmount").doesNotExist());
		verify(produceSaleService).update(eq(1), any(ProduceSaleDto.class));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 7, 999})
	void updateInvokesServiceWithPathId(int id) throws Exception {
		when(produceSaleService.update(eq(id), any(ProduceSaleDto.class))).thenReturn(produceSale);

		mockMvc.perform(put("/produce-sales/" + id)
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new ProduceSaleDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceSale updated successfully"));
		verify(produceSaleService).update(eq(id), any(ProduceSaleDto.class));
	}

	@Test
	void deleteReturnsMessageOnlyAndNoEntityFields() throws Exception {
		mockMvc.perform(delete("/produce-sales/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceSale deleted successfully"))
				.andExpect(jsonPath("$.saleId").doesNotExist())
				.andExpect(jsonPath("$.paymentStatus").doesNotExist());
		verify(produceSaleService).delete(1);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 7, 999})
	void deleteInvokesServiceWithPathId(int id) throws Exception {
		mockMvc.perform(delete("/produce-sales/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("ProduceSale deleted successfully"));
		verify(produceSaleService).delete(id);
	}

	@Test
	void deleteNeverInvokesGetAll() throws Exception {
		mockMvc.perform(delete("/produce-sales/1"))
				.andExpect(status().isOk());
		verify(produceSaleService, never()).getAll();
	}

	// ===================== View scoping (RBAC) =====================

	private Authentication authWithRole(int userId, String role) {
		return new UsernamePasswordAuthenticationToken(
				userId, null, List.of(new SimpleGrantedAuthority("ROLE_" + role)));
	}

	@Test
	void farmerGetAllReturnsOnlyOwnSales() throws Exception {
		when(farmerClient.getOwnedFarmerIds(any())).thenReturn(List.of(2));
		when(produceSaleService.getByOwnerFarmerIds(List.of(2))).thenReturn(List.of(produceSale));

		mockMvc.perform(get("/produce-sales").principal(authWithRole(10, "Farmer")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1))
				.andExpect(jsonPath("$[0].saleId").value(1));
		verify(produceSaleService).getByOwnerFarmerIds(List.of(2));
		verify(produceSaleService, never()).getAll();
	}

	@Test
	void farmerCannotViewAnotherFarmersSaleById() throws Exception {
		when(produceSaleService.getById(1)).thenReturn(produceSale);
		when(farmerClient.getOwnedFarmerIds(any())).thenReturn(List.of(99));
		when(produceSaleService.isSaleOwnedBy(produceSale, List.of(99))).thenReturn(false);

		mockMvc.perform(get("/produce-sales/1").principal(authWithRole(10, "Farmer")))
				.andExpect(status().isForbidden());
	}

	@Test
	void extensionOfficerViewsAllSales() throws Exception {
		when(produceSaleService.getAll()).thenReturn(List.of(produceSale));

		mockMvc.perform(get("/produce-sales").principal(authWithRole(20, "ExtensionOfficer")))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(1));
		verify(produceSaleService).getAll();
		verify(farmerClient, never()).getOwnedFarmerIds(any());
	}
}

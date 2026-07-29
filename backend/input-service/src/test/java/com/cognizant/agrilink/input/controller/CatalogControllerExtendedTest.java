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

import com.cognizant.agrilink.input.dto.CatalogDto;
import com.cognizant.agrilink.input.entity.Catalog;
import com.cognizant.agrilink.input.enums.Status;
import com.cognizant.agrilink.input.service.CatalogService;
import com.fasterxml.jackson.databind.ObjectMapper;
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
class CatalogControllerExtendedTest {

	@Mock
	private CatalogService catalogService;

	@InjectMocks
	private CatalogController catalogController;

	private MockMvc mockMvc;
	private final ObjectMapper objectMapper = new ObjectMapper();

	@BeforeEach
	void setUp() {
		mockMvc = MockMvcBuilders.standaloneSetup(catalogController).build();
	}

	private Catalog buildCatalog() {
		return Catalog.builder()
				.inputId(1)
				.name("Urea")
				.category("Fertiliser")
				.unit("Kg")
				.pricePerUnit(45.5)
				.subsidisedPrice(30.0)
				.availableStock(500)
				.status(Status.AC)
				.build();
	}

	@Test
	void getByIdReturnsAllFields() throws Exception {
		when(catalogService.getById(1)).thenReturn(buildCatalog());

		mockMvc.perform(get("/catalogs/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.inputId").value(1))
				.andExpect(jsonPath("$.name").value("Urea"))
				.andExpect(jsonPath("$.category").value("Fertiliser"))
				.andExpect(jsonPath("$.unit").value("Kg"))
				.andExpect(jsonPath("$.pricePerUnit").value(45.5))
				.andExpect(jsonPath("$.subsidisedPrice").value(30.0))
				.andExpect(jsonPath("$.availableStock").value(500))
				.andExpect(jsonPath("$.status").value("AC"));
		verify(catalogService).getById(1);
	}

	@Test
	void getAllReturnsAllFields() throws Exception {
		when(catalogService.getAll()).thenReturn(List.of(buildCatalog()));

		mockMvc.perform(get("/catalogs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$[0].inputId").value(1))
				.andExpect(jsonPath("$[0].name").value("Urea"))
				.andExpect(jsonPath("$[0].category").value("Fertiliser"))
				.andExpect(jsonPath("$[0].unit").value("Kg"))
				.andExpect(jsonPath("$[0].pricePerUnit").value(45.5))
				.andExpect(jsonPath("$[0].subsidisedPrice").value(30.0))
				.andExpect(jsonPath("$[0].availableStock").value(500))
				.andExpect(jsonPath("$[0].status").value("AC"));
	}

	@Test
	void getAllReturnsEmptyList() throws Exception {
		when(catalogService.getAll()).thenReturn(List.of());

		mockMvc.perform(get("/catalogs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$").isEmpty());
	}

	@Test
	void getAllReturnsManyRecords() throws Exception {
		when(catalogService.getAll()).thenReturn(List.of(
				Catalog.builder().inputId(1).name("A").build(),
				Catalog.builder().inputId(2).name("B").build(),
				Catalog.builder().inputId(3).name("C").build()));

		mockMvc.perform(get("/catalogs"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.length()").value(3))
				.andExpect(jsonPath("$[2].name").value("C"));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 50, 999, 100000})
	void getByIdForVariousIds(int id) throws Exception {
		Catalog catalog = Catalog.builder().inputId(id).name("Urea").build();
		when(catalogService.getById(id)).thenReturn(catalog);

		mockMvc.perform(get("/catalogs/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.inputId").value(id));
		verify(catalogService).getById(id);
	}

	@ParameterizedTest
	@EnumSource(Status.class)
	void getByIdReflectsStatus(Status statusValue) throws Exception {
		Catalog catalog = buildCatalog();
		catalog.setStatus(statusValue);
		when(catalogService.getById(1)).thenReturn(catalog);

		mockMvc.perform(get("/catalogs/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.status").value(statusValue.name()));
	}

	@ParameterizedTest
	@ValueSource(strings = {"Seed", "Fertiliser", "Pesticide", "Equipment"})
	void getByIdReflectsCategory(String category) throws Exception {
		Catalog catalog = buildCatalog();
		catalog.setCategory(category);
		when(catalogService.getById(1)).thenReturn(catalog);

		mockMvc.perform(get("/catalogs/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.category").value(category));
	}

	@ParameterizedTest
	@ValueSource(strings = {"Kg", "Litre", "Packet", "Piece"})
	void getByIdReflectsUnit(String unit) throws Exception {
		Catalog catalog = buildCatalog();
		catalog.setUnit(unit);
		when(catalogService.getById(1)).thenReturn(catalog);

		mockMvc.perform(get("/catalogs/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.unit").value(unit));
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.01, 1.0, 99.99, 10000.0})
	void getByIdReflectsPrice(double price) throws Exception {
		Catalog catalog = buildCatalog();
		catalog.setPricePerUnit(price);
		when(catalogService.getById(1)).thenReturn(catalog);

		mockMvc.perform(get("/catalogs/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.pricePerUnit").value(price));
	}

	@ParameterizedTest
	@ValueSource(ints = {0, 1, 100, 9999, 1000000})
	void getByIdReflectsStock(int stock) throws Exception {
		Catalog catalog = buildCatalog();
		catalog.setAvailableStock(stock);
		when(catalogService.getById(1)).thenReturn(catalog);

		mockMvc.perform(get("/catalogs/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.availableStock").value(stock));
	}

	@Test
	void createReturnsMessageOnly() throws Exception {
		when(catalogService.create(any(CatalogDto.class))).thenReturn(buildCatalog());

		mockMvc.perform(post("/catalogs")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CatalogDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Catalog created successfully"))
				.andExpect(jsonPath("$.name").doesNotExist());
		verify(catalogService).create(any(CatalogDto.class));
	}

	@ParameterizedTest
	@CsvSource({
			"Maize Seed,Seed,Packet",
			"DAP,Fertiliser,Kg",
			"Glyphosate,Pesticide,Litre",
			"Sprayer,Equipment,Piece"
	})
	void createWithVariousPayloads(String name, String category, String unit) throws Exception {
		when(catalogService.create(any(CatalogDto.class))).thenReturn(buildCatalog());
		CatalogDto dto = CatalogDto.builder().name(name).category(category).unit(unit).build();

		mockMvc.perform(post("/catalogs")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(dto)))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Catalog created successfully"));
		verify(catalogService).create(any(CatalogDto.class));
	}

	@Test
	void updateReturnsMessageOnly() throws Exception {
		when(catalogService.update(eq(1), any(CatalogDto.class))).thenReturn(buildCatalog());

		mockMvc.perform(put("/catalogs/1")
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CatalogDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Catalog updated successfully"))
				.andExpect(jsonPath("$.name").doesNotExist());
		verify(catalogService).update(eq(1), any(CatalogDto.class));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 50, 999})
	void updateForVariousIds(int id) throws Exception {
		when(catalogService.update(eq(id), any(CatalogDto.class))).thenReturn(buildCatalog());

		mockMvc.perform(put("/catalogs/" + id)
						.contentType(MediaType.APPLICATION_JSON)
						.content(objectMapper.writeValueAsString(new CatalogDto())))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Catalog updated successfully"));
		verify(catalogService).update(eq(id), any(CatalogDto.class));
	}

	@Test
	void deleteReturnsMessageOnly() throws Exception {
		mockMvc.perform(delete("/catalogs/1"))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Catalog deleted successfully"));
		verify(catalogService).delete(1);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 50, 999})
	void deleteForVariousIds(int id) throws Exception {
		mockMvc.perform(delete("/catalogs/" + id))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.message").value("Catalog deleted successfully"));
		verify(catalogService).delete(id);
	}
}

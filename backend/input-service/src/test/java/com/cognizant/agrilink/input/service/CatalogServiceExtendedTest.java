package com.cognizant.agrilink.input.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.input.dto.CatalogDto;
import com.cognizant.agrilink.input.entity.Catalog;
import com.cognizant.agrilink.input.enums.Status;
import com.cognizant.agrilink.input.repository.CatalogRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CatalogServiceExtendedTest {

	@Mock
	private CatalogRepository catalogRepository;

	@InjectMocks
	private CatalogService catalogService;

	private CatalogDto buildDto() {
		return CatalogDto.builder()
				.name("Urea")
				.category("Fertiliser")
				.unit("Kg")
				.pricePerUnit(45.5)
				.subsidisedPrice(30.0)
				.availableStock(500)
				.status(Status.AC)
				.build();
	}

	@ParameterizedTest
	@EnumSource(Status.class)
	void createPropagatesStatus(Status status) {
		CatalogDto dto = buildDto();
		dto.setStatus(status);
		when(catalogRepository.save(any(Catalog.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Catalog> captor = ArgumentCaptor.forClass(Catalog.class);
		catalogService.create(dto);

		verify(catalogRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(strings = {"Seed", "Fertiliser", "Pesticide", "Equipment"})
	void createPropagatesCategory(String category) {
		CatalogDto dto = buildDto();
		dto.setCategory(category);
		when(catalogRepository.save(any(Catalog.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Catalog> captor = ArgumentCaptor.forClass(Catalog.class);
		catalogService.create(dto);

		verify(catalogRepository).save(captor.capture());
		assertThat(captor.getValue().getCategory()).isEqualTo(category);
	}

	@ParameterizedTest
	@ValueSource(strings = {"Kg", "Litre", "Packet", "Piece"})
	void createPropagatesUnit(String unit) {
		CatalogDto dto = buildDto();
		dto.setUnit(unit);
		when(catalogRepository.save(any(Catalog.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Catalog> captor = ArgumentCaptor.forClass(Catalog.class);
		catalogService.create(dto);

		verify(catalogRepository).save(captor.capture());
		assertThat(captor.getValue().getUnit()).isEqualTo(unit);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.01, 1.0, 99.99, 10000.0})
	void createPropagatesPrice(double price) {
		CatalogDto dto = buildDto();
		dto.setPricePerUnit(price);
		when(catalogRepository.save(any(Catalog.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Catalog> captor = ArgumentCaptor.forClass(Catalog.class);
		catalogService.create(dto);

		verify(catalogRepository).save(captor.capture());
		assertThat(captor.getValue().getPricePerUnit()).isEqualTo(price);
	}

	@ParameterizedTest
	@ValueSource(ints = {0, 1, 100, 9999, 1000000})
	void createPropagatesStock(int stock) {
		CatalogDto dto = buildDto();
		dto.setAvailableStock(stock);
		when(catalogRepository.save(any(Catalog.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Catalog> captor = ArgumentCaptor.forClass(Catalog.class);
		catalogService.create(dto);

		verify(catalogRepository).save(captor.capture());
		assertThat(captor.getValue().getAvailableStock()).isEqualTo(stock);
	}

	@ParameterizedTest
	@CsvSource({
			"Maize Seed,Seed,Packet",
			"DAP,Fertiliser,Kg",
			"Glyphosate,Pesticide,Litre",
			"Sprayer,Equipment,Piece"
	})
	void createPropagatesCombination(String name, String category, String unit) {
		CatalogDto dto = buildDto();
		dto.setName(name);
		dto.setCategory(category);
		dto.setUnit(unit);
		when(catalogRepository.save(any(Catalog.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Catalog> captor = ArgumentCaptor.forClass(Catalog.class);
		catalogService.create(dto);

		verify(catalogRepository).save(captor.capture());
		Catalog captured = captor.getValue();
		assertThat(captured.getName()).isEqualTo(name);
		assertThat(captured.getCategory()).isEqualTo(category);
		assertThat(captured.getUnit()).isEqualTo(unit);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 50, 999, 100000})
	void getByIdLooksUpVariousIds(int id) {
		Catalog catalog = Catalog.builder().inputId(id).name("Urea").build();
		when(catalogRepository.findById(id)).thenReturn(Optional.of(catalog));

		assertThat(catalogService.getById(id).getInputId()).isEqualTo(id);
		verify(catalogRepository).findById(id);
	}

	@ParameterizedTest
	@ValueSource(ints = {99, 100, 500, 9999})
	void getByIdThrowsForVariousMissingIds(int id) {
		when(catalogRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> catalogService.getById(id))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessageContaining(String.valueOf(id));
	}

	@Test
	void getAllReturnsEmptyList() {
		when(catalogRepository.findAll()).thenReturn(new ArrayList<>());

		assertThat(catalogService.getAll()).isEmpty();
		verify(catalogRepository).findAll();
	}

	@Test
	void getAllReturnsManyRecords() {
		List<Catalog> many = List.of(
				Catalog.builder().inputId(1).build(),
				Catalog.builder().inputId(2).build(),
				Catalog.builder().inputId(3).build());
		when(catalogRepository.findAll()).thenReturn(many);

		assertThat(catalogService.getAll()).hasSize(3);
	}

	@Test
	void updateModifiesEachField() {
		Catalog existing = Catalog.builder().inputId(1).name("Old").build();
		when(catalogRepository.findById(1)).thenReturn(Optional.of(existing));
		when(catalogRepository.save(any(Catalog.class))).thenAnswer(i -> i.getArgument(0));

		CatalogDto dto = buildDto();
		dto.setName("New");
		catalogService.update(1, dto);

		ArgumentCaptor<Catalog> captor = ArgumentCaptor.forClass(Catalog.class);
		verify(catalogRepository).save(captor.capture());
		Catalog saved = captor.getValue();
		assertThat(saved.getName()).isEqualTo("New");
		assertThat(saved.getCategory()).isEqualTo("Fertiliser");
		assertThat(saved.getUnit()).isEqualTo("Kg");
		assertThat(saved.getPricePerUnit()).isEqualTo(45.5);
		assertThat(saved.getSubsidisedPrice()).isEqualTo(30.0);
		assertThat(saved.getAvailableStock()).isEqualTo(500);
		assertThat(saved.getStatus()).isEqualTo(Status.AC);
	}

	@Test
	void updateThrowsWhenMissing() {
		when(catalogRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> catalogService.update(99, buildDto()))
				.isInstanceOf(EntityNotFoundException.class);
		verify(catalogRepository, never()).save(any(Catalog.class));
	}

	@Test
	void updateRetainsId() {
		Catalog existing = Catalog.builder().inputId(7).build();
		when(catalogRepository.findById(7)).thenReturn(Optional.of(existing));
		when(catalogRepository.save(any(Catalog.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Catalog> captor = ArgumentCaptor.forClass(Catalog.class);
		catalogService.update(7, buildDto());

		verify(catalogRepository).save(captor.capture());
		assertThat(captor.getValue().getInputId()).isEqualTo(7);
	}

	@Test
	void deleteThrowsWhenMissing() {
		when(catalogRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> catalogService.delete(99))
				.isInstanceOf(EntityNotFoundException.class);
		verify(catalogRepository, never()).delete(any(Catalog.class));
	}

	@Test
	void deleteInvokesRepositoryOnce() {
		Catalog existing = Catalog.builder().inputId(1).build();
		when(catalogRepository.findById(1)).thenReturn(Optional.of(existing));

		catalogService.delete(1);

		verify(catalogRepository, times(1)).delete(existing);
	}

	@Test
	void createReturnsSavedEntity() {
		Catalog saved = Catalog.builder().inputId(5).name("Urea").build();
		when(catalogRepository.save(any(Catalog.class))).thenReturn(saved);

		assertThat(catalogService.create(buildDto()).getInputId()).isEqualTo(5);
	}

	@Test
	void createNeverSetsId() {
		when(catalogRepository.save(any(Catalog.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Catalog> captor = ArgumentCaptor.forClass(Catalog.class);
		catalogService.create(buildDto());

		verify(catalogRepository).save(captor.capture());
		assertThat(captor.getValue().getInputId()).isNull();
	}
}

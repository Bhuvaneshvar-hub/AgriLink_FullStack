package com.cognizant.agrilink.input.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.input.dto.CatalogDto;
import com.cognizant.agrilink.input.entity.Catalog;
import com.cognizant.agrilink.input.enums.Status;
import com.cognizant.agrilink.input.repository.CatalogRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CatalogServiceTest {

	@Mock
	private CatalogRepository catalogRepository;

	@InjectMocks
	private CatalogService catalogService;

	private Catalog catalog;
	private CatalogDto dto;

	@BeforeEach
	void setUp() {
		catalog = Catalog.builder()
				.inputId(1)
				.name("Urea")
				.category("Fertiliser")
				.unit("Kg")
				.pricePerUnit(45.5)
				.subsidisedPrice(30.0)
				.availableStock(500)
				.status(Status.AC)
				.build();
		dto = CatalogDto.builder()
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
	void getAllReturnsList() {
		when(catalogRepository.findAll()).thenReturn(List.of(catalog));

		assertThat(catalogService.getAll()).hasSize(1);
		verify(catalogRepository).findAll();
	}

	@Test
	void getByIdReturnsRecord() {
		when(catalogRepository.findById(1)).thenReturn(Optional.of(catalog));

		assertThat(catalogService.getById(1).getName()).isEqualTo("Urea");
	}

	@Test
	void getByIdThrowsWhenMissing() {
		when(catalogRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> catalogService.getById(99))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@Test
	void createSavesRecord() {
		when(catalogRepository.save(any(Catalog.class))).thenReturn(catalog);

		catalogService.create(dto);

		verify(catalogRepository).save(any(Catalog.class));
	}

	@Test
	void updateModifiesRecord() {
		when(catalogRepository.findById(1)).thenReturn(Optional.of(catalog));
		when(catalogRepository.save(any(Catalog.class))).thenReturn(catalog);

		catalogService.update(1, dto);

		verify(catalogRepository).save(any(Catalog.class));
	}

	@Test
	void deleteRemovesRecord() {
		when(catalogRepository.findById(1)).thenReturn(Optional.of(catalog));

		catalogService.delete(1);

		verify(catalogRepository, times(1)).delete(catalog);
	}
}

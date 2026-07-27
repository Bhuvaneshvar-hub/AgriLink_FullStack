package com.cognizant.agrilink.crop.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.crop.enums.Status;
import com.cognizant.agrilink.crop.dto.CropCatalogDto;
import com.cognizant.agrilink.crop.entity.CropCatalog;
import com.cognizant.agrilink.crop.repository.CropCatalogRepository;
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
class CropCatalogServiceTest {

	@Mock
	private CropCatalogRepository cropCatalogRepository;

	@InjectMocks
	private CropCatalogService cropCatalogService;

	private CropCatalog cropCatalog;
	private CropCatalogDto dto;

	@BeforeEach
	void setUp() {
		cropCatalog = CropCatalog.builder()
				.cropId(1)
				.cropName("Wheat")
				.category("Cereal")
				.season("Rabi")
				.typicalDurationDays(120)
				.expectedYieldPerAcre(20.5)
				.status(Status.AC)
				.build();
		dto = CropCatalogDto.builder()
				.cropName("Wheat")
				.category("Cereal")
				.season("Rabi")
				.typicalDurationDays(120)
				.expectedYieldPerAcre(20.5)
				.status(Status.AC)
				.build();
	}

	@Test
	void getAllReturnsList() {
		when(cropCatalogRepository.findAll()).thenReturn(List.of(cropCatalog));

		assertThat(cropCatalogService.getAll()).hasSize(1);
		verify(cropCatalogRepository).findAll();
	}

	@Test
	void getByIdReturnsRecord() {
		when(cropCatalogRepository.findById(1)).thenReturn(Optional.of(cropCatalog));

		assertThat(cropCatalogService.getById(1).getCropName()).isEqualTo("Wheat");
	}

	@Test
	void getByIdThrowsWhenMissing() {
		when(cropCatalogRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> cropCatalogService.getById(99))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@Test
	void createSavesRecord() {
		when(cropCatalogRepository.save(any(CropCatalog.class))).thenReturn(cropCatalog);

		cropCatalogService.create(dto);

		verify(cropCatalogRepository).save(any(CropCatalog.class));
	}

	@Test
	void updateModifiesRecord() {
		when(cropCatalogRepository.findById(1)).thenReturn(Optional.of(cropCatalog));
		when(cropCatalogRepository.save(any(CropCatalog.class))).thenReturn(cropCatalog);

		cropCatalogService.update(1, dto);

		verify(cropCatalogRepository).save(any(CropCatalog.class));
	}

	@Test
	void deleteRemovesRecord() {
		when(cropCatalogRepository.findById(1)).thenReturn(Optional.of(cropCatalog));

		cropCatalogService.delete(1);

		verify(cropCatalogRepository, times(1)).delete(cropCatalog);
	}
}

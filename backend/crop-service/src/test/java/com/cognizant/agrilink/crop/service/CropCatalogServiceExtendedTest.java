package com.cognizant.agrilink.crop.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.crop.enums.Status;
import com.cognizant.agrilink.crop.dto.CropCatalogDto;
import com.cognizant.agrilink.crop.entity.CropCatalog;
import com.cognizant.agrilink.crop.repository.CropCatalogRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.Collections;
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
class CropCatalogServiceExtendedTest {

	@Mock
	private CropCatalogRepository cropCatalogRepository;

	@InjectMocks
	private CropCatalogService cropCatalogService;

	private CropCatalog buildCropCatalog() {
		return CropCatalog.builder()
				.cropId(1)
				.cropName("Wheat")
				.category("Cereal")
				.season("Rabi")
				.typicalDurationDays(120)
				.expectedYieldPerAcre(20.5)
				.status(Status.AC)
				.build();
	}

	private CropCatalogDto buildDto() {
		return CropCatalogDto.builder()
				.cropName("Wheat")
				.category("Cereal")
				.season("Rabi")
				.typicalDurationDays(120)
				.expectedYieldPerAcre(20.5)
				.status(Status.AC)
				.build();
	}

	@Test
	void getAllReturnsEmptyList() {
		when(cropCatalogRepository.findAll()).thenReturn(Collections.emptyList());

		assertThat(cropCatalogService.getAll()).isEmpty();
		verify(cropCatalogRepository).findAll();
	}

	@Test
	void getAllReturnsManyRecords() {
		when(cropCatalogRepository.findAll())
				.thenReturn(List.of(buildCropCatalog(), buildCropCatalog(), buildCropCatalog()));

		assertThat(cropCatalogService.getAll()).hasSize(3);
	}

	@Test
	void getByIdReturnsCorrectFields() {
		when(cropCatalogRepository.findById(1)).thenReturn(Optional.of(buildCropCatalog()));

		CropCatalog result = cropCatalogService.getById(1);

		assertThat(result.getCategory()).isEqualTo("Cereal");
		assertThat(result.getSeason()).isEqualTo("Rabi");
		assertThat(result.getTypicalDurationDays()).isEqualTo(120);
	}

	@Test
	void getByIdThrowsWithMessage() {
		when(cropCatalogRepository.findById(42)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> cropCatalogService.getById(42))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessageContaining("42");
	}

	@Test
	void createMapsAllFields() {
		ArgumentCaptor<CropCatalog> captor = ArgumentCaptor.forClass(CropCatalog.class);
		when(cropCatalogRepository.save(any(CropCatalog.class))).thenReturn(buildCropCatalog());

		cropCatalogService.create(buildDto());

		verify(cropCatalogRepository).save(captor.capture());
		CropCatalog saved = captor.getValue();
		assertThat(saved.getCropName()).isEqualTo("Wheat");
		assertThat(saved.getCategory()).isEqualTo("Cereal");
		assertThat(saved.getSeason()).isEqualTo("Rabi");
		assertThat(saved.getTypicalDurationDays()).isEqualTo(120);
		assertThat(saved.getExpectedYieldPerAcre()).isEqualTo(20.5);
		assertThat(saved.getStatus()).isEqualTo(Status.AC);
	}

	@Test
	void updateModifiesEachField() {
		CropCatalog existing = buildCropCatalog();
		ArgumentCaptor<CropCatalog> captor = ArgumentCaptor.forClass(CropCatalog.class);
		when(cropCatalogRepository.findById(1)).thenReturn(Optional.of(existing));
		when(cropCatalogRepository.save(any(CropCatalog.class))).thenReturn(existing);

		CropCatalogDto dto = CropCatalogDto.builder()
				.cropName("Barley")
				.category("Grain")
				.season("Kharif")
				.typicalDurationDays(90)
				.expectedYieldPerAcre(15.0)
				.status(Status.IN)
				.build();

		cropCatalogService.update(1, dto);

		verify(cropCatalogRepository).save(captor.capture());
		CropCatalog saved = captor.getValue();
		assertThat(saved.getCropName()).isEqualTo("Barley");
		assertThat(saved.getCategory()).isEqualTo("Grain");
		assertThat(saved.getSeason()).isEqualTo("Kharif");
		assertThat(saved.getTypicalDurationDays()).isEqualTo(90);
		assertThat(saved.getExpectedYieldPerAcre()).isEqualTo(15.0);
		assertThat(saved.getStatus()).isEqualTo(Status.IN);
	}

	@Test
	void updateThrowsWhenMissing() {
		when(cropCatalogRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> cropCatalogService.update(99, buildDto()))
				.isInstanceOf(EntityNotFoundException.class);
		verify(cropCatalogRepository, never()).save(any(CropCatalog.class));
	}

	@Test
	void deleteThrowsWhenMissing() {
		when(cropCatalogRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> cropCatalogService.delete(99))
				.isInstanceOf(EntityNotFoundException.class);
		verify(cropCatalogRepository, never()).delete(any(CropCatalog.class));
	}

	@Test
	void deleteInvokesRepositoryDelete() {
		CropCatalog existing = buildCropCatalog();
		when(cropCatalogRepository.findById(1)).thenReturn(Optional.of(existing));

		cropCatalogService.delete(1);

		verify(cropCatalogRepository, times(1)).delete(existing);
	}

	@ParameterizedTest
	@ValueSource(ints = { 1, 5, 10, 100, 9999 })
	void getByIdWithVariousIds(int id) {
		when(cropCatalogRepository.findById(id)).thenReturn(Optional.of(buildCropCatalog()));

		assertThat(cropCatalogService.getById(id)).isNotNull();
		verify(cropCatalogRepository).findById(id);
	}

	@ParameterizedTest
	@ValueSource(ints = { 2, 3, 77, 555, 8888 })
	void getByIdThrowsForVariousMissingIds(int id) {
		when(cropCatalogRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> cropCatalogService.getById(id))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@ParameterizedTest
	@ValueSource(strings = { "Kharif", "Rabi", "Zaid", "Perennial" })
	void createWithVariousSeasons(String season) {
		ArgumentCaptor<CropCatalog> captor = ArgumentCaptor.forClass(CropCatalog.class);
		when(cropCatalogRepository.save(any(CropCatalog.class))).thenReturn(buildCropCatalog());

		CropCatalogDto dto = buildDto();
		dto.setSeason(season);
		cropCatalogService.create(dto);

		verify(cropCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getSeason()).isEqualTo(season);
	}

	@ParameterizedTest
	@EnumSource(Status.class)
	void createWithVariousStatuses(Status status) {
		ArgumentCaptor<CropCatalog> captor = ArgumentCaptor.forClass(CropCatalog.class);
		when(cropCatalogRepository.save(any(CropCatalog.class))).thenReturn(buildCropCatalog());

		CropCatalogDto dto = buildDto();
		dto.setStatus(status);
		cropCatalogService.create(dto);

		verify(cropCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@CsvSource({
			"Wheat,Cereal,120,20.5",
			"Rice,Cereal,150,30.0",
			"Gram,Pulse,100,12.5",
			"Mustard,Oilseed,110,8.0"
	})
	void createWithCsvData(String name, String category, int duration, double yield) {
		ArgumentCaptor<CropCatalog> captor = ArgumentCaptor.forClass(CropCatalog.class);
		when(cropCatalogRepository.save(any(CropCatalog.class))).thenReturn(buildCropCatalog());

		CropCatalogDto dto = CropCatalogDto.builder()
				.cropName(name)
				.category(category)
				.season("Kharif")
				.typicalDurationDays(duration)
				.expectedYieldPerAcre(yield)
				.status(Status.AC)
				.build();
		cropCatalogService.create(dto);

		verify(cropCatalogRepository).save(captor.capture());
		CropCatalog saved = captor.getValue();
		assertThat(saved.getCropName()).isEqualTo(name);
		assertThat(saved.getTypicalDurationDays()).isEqualTo(duration);
		assertThat(saved.getExpectedYieldPerAcre()).isEqualTo(yield);
	}

	@ParameterizedTest
	@ValueSource(doubles = { 0.0, 1.5, 20.5, 99.99, 500.0 })
	void createWithBoundaryYields(double yield) {
		ArgumentCaptor<CropCatalog> captor = ArgumentCaptor.forClass(CropCatalog.class);
		when(cropCatalogRepository.save(any(CropCatalog.class))).thenReturn(buildCropCatalog());

		CropCatalogDto dto = buildDto();
		dto.setExpectedYieldPerAcre(yield);
		cropCatalogService.create(dto);

		verify(cropCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getExpectedYieldPerAcre()).isEqualTo(yield);
	}
}

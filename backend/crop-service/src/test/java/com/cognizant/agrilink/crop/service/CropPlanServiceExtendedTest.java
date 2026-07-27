package com.cognizant.agrilink.crop.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.crop.enums.Status;
import com.cognizant.agrilink.crop.dto.CropPlanDto;
import com.cognizant.agrilink.crop.entity.CropPlan;
import com.cognizant.agrilink.crop.repository.CropPlanRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
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
class CropPlanServiceExtendedTest {

	@Mock
	private CropPlanRepository cropPlanRepository;

	@InjectMocks
	private CropPlanService cropPlanService;

	private CropPlan buildCropPlan() {
		return CropPlan.builder()
				.planId(1)
				.farmerId(1)
				.holdingId(2)
				.cropId(3)
				.season("Rabi")
				.year(2026)
				.sowingDate(LocalDate.of(2026, 1, 10))
				.expectedHarvestDate(LocalDate.of(2026, 5, 10))
				.areaPlanted(5.5)
				.status(Status.AC)
				.build();
	}

	private CropPlanDto buildDto() {
		return CropPlanDto.builder()
				.farmerId(1)
				.holdingId(2)
				.cropId(3)
				.season("Rabi")
				.year(2026)
				.sowingDate(LocalDate.of(2026, 1, 10))
				.expectedHarvestDate(LocalDate.of(2026, 5, 10))
				.areaPlanted(5.5)
				.status(Status.AC)
				.build();
	}

	@Test
	void getAllReturnsEmptyList() {
		when(cropPlanRepository.findAll()).thenReturn(Collections.emptyList());

		assertThat(cropPlanService.getAll()).isEmpty();
		verify(cropPlanRepository).findAll();
	}

	@Test
	void getAllReturnsManyRecords() {
		when(cropPlanRepository.findAll())
				.thenReturn(List.of(buildCropPlan(), buildCropPlan()));

		assertThat(cropPlanService.getAll()).hasSize(2);
	}

	@Test
	void getByIdReturnsCorrectFields() {
		when(cropPlanRepository.findById(1)).thenReturn(Optional.of(buildCropPlan()));

		CropPlan result = cropPlanService.getById(1);

		assertThat(result.getFarmerId()).isEqualTo(1);
		assertThat(result.getSeason()).isEqualTo("Rabi");
		assertThat(result.getYear()).isEqualTo(2026);
		assertThat(result.getSowingDate()).isEqualTo(LocalDate.of(2026, 1, 10));
	}

	@Test
	void getByIdThrowsWithMessage() {
		when(cropPlanRepository.findById(50)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> cropPlanService.getById(50))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessageContaining("50");
	}

	@Test
	void createMapsAllFields() {
		ArgumentCaptor<CropPlan> captor = ArgumentCaptor.forClass(CropPlan.class);
		when(cropPlanRepository.save(any(CropPlan.class))).thenReturn(buildCropPlan());

		cropPlanService.create(buildDto());

		verify(cropPlanRepository).save(captor.capture());
		CropPlan saved = captor.getValue();
		assertThat(saved.getFarmerId()).isEqualTo(1);
		assertThat(saved.getHoldingId()).isEqualTo(2);
		assertThat(saved.getCropId()).isEqualTo(3);
		assertThat(saved.getSeason()).isEqualTo("Rabi");
		assertThat(saved.getYear()).isEqualTo(2026);
		assertThat(saved.getSowingDate()).isEqualTo(LocalDate.of(2026, 1, 10));
		assertThat(saved.getExpectedHarvestDate()).isEqualTo(LocalDate.of(2026, 5, 10));
		assertThat(saved.getAreaPlanted()).isEqualTo(5.5);
		assertThat(saved.getStatus()).isEqualTo(Status.AC);
	}

	@Test
	void updateModifiesEachField() {
		CropPlan existing = buildCropPlan();
		ArgumentCaptor<CropPlan> captor = ArgumentCaptor.forClass(CropPlan.class);
		when(cropPlanRepository.findById(1)).thenReturn(Optional.of(existing));
		when(cropPlanRepository.save(any(CropPlan.class))).thenReturn(existing);

		CropPlanDto dto = CropPlanDto.builder()
				.farmerId(9)
				.holdingId(8)
				.cropId(7)
				.season("Kharif")
				.year(2027)
				.sowingDate(LocalDate.of(2027, 7, 1))
				.expectedHarvestDate(LocalDate.of(2027, 11, 1))
				.areaPlanted(20.0)
				.status(Status.AC)
				.build();

		cropPlanService.update(1, dto);

		verify(cropPlanRepository).save(captor.capture());
		CropPlan saved = captor.getValue();
		assertThat(saved.getFarmerId()).isEqualTo(9);
		assertThat(saved.getHoldingId()).isEqualTo(8);
		assertThat(saved.getCropId()).isEqualTo(7);
		assertThat(saved.getSeason()).isEqualTo("Kharif");
		assertThat(saved.getYear()).isEqualTo(2027);
		assertThat(saved.getSowingDate()).isEqualTo(LocalDate.of(2027, 7, 1));
		assertThat(saved.getExpectedHarvestDate()).isEqualTo(LocalDate.of(2027, 11, 1));
		assertThat(saved.getAreaPlanted()).isEqualTo(20.0);
		assertThat(saved.getStatus()).isEqualTo(Status.AC);
	}

	@Test
	void updateThrowsWhenMissing() {
		when(cropPlanRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> cropPlanService.update(99, buildDto()))
				.isInstanceOf(EntityNotFoundException.class);
		verify(cropPlanRepository, never()).save(any(CropPlan.class));
	}

	@Test
	void deleteThrowsWhenMissing() {
		when(cropPlanRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> cropPlanService.delete(99))
				.isInstanceOf(EntityNotFoundException.class);
		verify(cropPlanRepository, never()).delete(any(CropPlan.class));
	}

	@Test
	void deleteInvokesRepositoryDelete() {
		CropPlan existing = buildCropPlan();
		when(cropPlanRepository.findById(1)).thenReturn(Optional.of(existing));

		cropPlanService.delete(1);

		verify(cropPlanRepository, times(1)).delete(existing);
	}

	@ParameterizedTest
	@ValueSource(ints = { 1, 4, 11, 250, 9001 })
	void getByIdWithVariousIds(int id) {
		when(cropPlanRepository.findById(id)).thenReturn(Optional.of(buildCropPlan()));

		assertThat(cropPlanService.getById(id)).isNotNull();
		verify(cropPlanRepository).findById(id);
	}

	@ParameterizedTest
	@ValueSource(strings = { "Kharif", "Rabi", "Zaid", "Perennial" })
	void createWithVariousSeasons(String season) {
		ArgumentCaptor<CropPlan> captor = ArgumentCaptor.forClass(CropPlan.class);
		when(cropPlanRepository.save(any(CropPlan.class))).thenReturn(buildCropPlan());

		CropPlanDto dto = buildDto();
		dto.setSeason(season);
		cropPlanService.create(dto);

		verify(cropPlanRepository).save(captor.capture());
		assertThat(captor.getValue().getSeason()).isEqualTo(season);
	}

	@ParameterizedTest
	@ValueSource(ints = { 2020, 2023, 2025, 2026, 2030 })
	void createWithBoundaryYears(int year) {
		ArgumentCaptor<CropPlan> captor = ArgumentCaptor.forClass(CropPlan.class);
		when(cropPlanRepository.save(any(CropPlan.class))).thenReturn(buildCropPlan());

		CropPlanDto dto = buildDto();
		dto.setYear(year);
		cropPlanService.create(dto);

		verify(cropPlanRepository).save(captor.capture());
		assertThat(captor.getValue().getYear()).isEqualTo(year);
	}

	@ParameterizedTest
	@ValueSource(doubles = { 0.1, 1.0, 5.5, 250.0, 1000.0 })
	void createWithBoundaryAreas(double area) {
		ArgumentCaptor<CropPlan> captor = ArgumentCaptor.forClass(CropPlan.class);
		when(cropPlanRepository.save(any(CropPlan.class))).thenReturn(buildCropPlan());

		CropPlanDto dto = buildDto();
		dto.setAreaPlanted(area);
		cropPlanService.create(dto);

		verify(cropPlanRepository).save(captor.capture());
		assertThat(captor.getValue().getAreaPlanted()).isEqualTo(area);
	}

	@ParameterizedTest
	@EnumSource(Status.class)
	void createWithVariousStatuses(Status status) {
		ArgumentCaptor<CropPlan> captor = ArgumentCaptor.forClass(CropPlan.class);
		when(cropPlanRepository.save(any(CropPlan.class))).thenReturn(buildCropPlan());

		CropPlanDto dto = buildDto();
		dto.setStatus(status);
		cropPlanService.create(dto);

		verify(cropPlanRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@CsvSource({
			"2026-01-10,2026-05-10",
			"2026-06-01,2026-10-01",
			"2027-02-15,2027-07-15"
	})
	void createWithVariousDates(String sowing, String harvest) {
		ArgumentCaptor<CropPlan> captor = ArgumentCaptor.forClass(CropPlan.class);
		when(cropPlanRepository.save(any(CropPlan.class))).thenReturn(buildCropPlan());

		CropPlanDto dto = buildDto();
		dto.setSowingDate(LocalDate.parse(sowing));
		dto.setExpectedHarvestDate(LocalDate.parse(harvest));
		cropPlanService.create(dto);

		verify(cropPlanRepository).save(captor.capture());
		CropPlan saved = captor.getValue();
		assertThat(saved.getSowingDate()).isEqualTo(LocalDate.parse(sowing));
		assertThat(saved.getExpectedHarvestDate()).isEqualTo(LocalDate.parse(harvest));
	}
}

package com.cognizant.agrilink.crop.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.crop.enums.PlanStatus;
import com.cognizant.agrilink.crop.enums.Status;
import com.cognizant.agrilink.crop.dto.CropPlanDto;
import com.cognizant.agrilink.crop.entity.CropCatalog;
import com.cognizant.agrilink.crop.entity.CropPlan;
import com.cognizant.agrilink.crop.repository.CropCatalogRepository;
import com.cognizant.agrilink.crop.repository.CropPlanRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CropPlanServiceTest {

	@Mock
	private CropPlanRepository cropPlanRepository;

	@Mock
	private CropCatalogRepository cropCatalogRepository;

	@InjectMocks
	private CropPlanService cropPlanService;

	private CropPlan cropPlan;
	private CropPlanDto dto;
	private CropCatalog cropCatalog;

	@BeforeEach
	void setUp() {
		cropPlan = CropPlan.builder()
				.planId(1)
				.farmerId(1)
				.holdingId(2)
				.cropId(3)
				.season("Rabi")
				.year(2026)
				.sowingDate(LocalDate.of(2026, 6, 15))
				.expectedHarvestDate(LocalDate.of(2026, 10, 15))
				.areaPlanted(5.5)
				.status(PlanStatus.PLANNED)
				.build();
		dto = CropPlanDto.builder()
				.farmerId(1)
				.holdingId(2)
				.cropId(3)
				.season("Rabi")
				.year(2026)
				.sowingDate(LocalDate.of(2026, 6, 15))
				.expectedHarvestDate(LocalDate.of(2026, 10, 15))
				.areaPlanted(5.5)
				.status(PlanStatus.PLANNED)
				.build();
		cropCatalog = CropCatalog.builder()
				.cropId(3)
				.cropName("Wheat")
				.category("Cereal")
				.season("Rabi")
				.typicalDurationDays(110)
				.expectedYieldPerAcre(18.5)
				.status(Status.AC)
				.build();
	}

	@Test
	void getAllReturnsList() {
		when(cropPlanRepository.findAll()).thenReturn(List.of(cropPlan));

		assertThat(cropPlanService.getAll()).hasSize(1);
		verify(cropPlanRepository).findAll();
	}

	@Test
	void getByIdReturnsRecord() {
		when(cropPlanRepository.findById(1)).thenReturn(Optional.of(cropPlan));

		assertThat(cropPlanService.getById(1).getSeason()).isEqualTo("Rabi");
	}

	@Test
	void getByIdThrowsWhenMissing() {
		when(cropPlanRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> cropPlanService.getById(99))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@Test
	void createSavesRecord() {
		when(cropCatalogRepository.findById(3)).thenReturn(Optional.of(cropCatalog));
		when(cropPlanRepository.save(any(CropPlan.class))).thenReturn(cropPlan);

		cropPlanService.create(dto);

		verify(cropPlanRepository).save(any(CropPlan.class));
	}

	@Test
	void createRejectsSeasonMismatchWithCrop() {
		// Crop #3 is a Rabi crop; scheduling it in a Kharif plan must be rejected.
		cropCatalog.setSeason("Kharif");
		when(cropCatalogRepository.findById(3)).thenReturn(Optional.of(cropCatalog));

		assertThatThrownBy(() -> cropPlanService.create(dto))
				.isInstanceOf(IllegalStateException.class);
	}

	@Test
	void createRejectsInvalidSeason() {
		dto.setSeason("Monsoon");

		assertThatThrownBy(() -> cropPlanService.create(dto))
				.isInstanceOf(IllegalArgumentException.class);
	}

	@Test
	void createRejectsHarvestNotAfterSowing() {
		dto.setSowingDate(LocalDate.of(2026, 6, 15));
		dto.setExpectedHarvestDate(LocalDate.of(2026, 6, 15));

		assertThatThrownBy(() -> cropPlanService.create(dto))
				.isInstanceOf(IllegalArgumentException.class);
	}

	@Test
	void updateModifiesRecord() {
		when(cropCatalogRepository.findById(3)).thenReturn(Optional.of(cropCatalog));
		when(cropPlanRepository.findById(1)).thenReturn(Optional.of(cropPlan));
		when(cropPlanRepository.save(any(CropPlan.class))).thenReturn(cropPlan);

		cropPlanService.update(1, dto);

		verify(cropPlanRepository).save(any(CropPlan.class));
	}

	@Test
	void deleteRemovesRecord() {
		when(cropPlanRepository.findById(1)).thenReturn(Optional.of(cropPlan));

		cropPlanService.delete(1);

		verify(cropPlanRepository, times(1)).delete(cropPlan);
	}
}


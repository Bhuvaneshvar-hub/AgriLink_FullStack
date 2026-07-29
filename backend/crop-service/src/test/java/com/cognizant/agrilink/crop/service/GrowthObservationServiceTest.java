package com.cognizant.agrilink.crop.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.crop.enums.Stage;
import com.cognizant.agrilink.crop.dto.GrowthObservationDto;
import com.cognizant.agrilink.crop.entity.GrowthObservation;
import com.cognizant.agrilink.crop.repository.GrowthObservationRepository;
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
class GrowthObservationServiceTest {

	@Mock
	private GrowthObservationRepository growthObservationRepository;

	@InjectMocks
	private GrowthObservationService growthObservationService;

	private GrowthObservation growthObservation;
	private GrowthObservationDto dto;

	@BeforeEach
	void setUp() {
		growthObservation = GrowthObservation.builder()
				.observationId(1)
				.planId(1)
				.officerId(2)
				.observationDate(LocalDate.of(2026, 6, 15))
				.stage(Stage.GR)
				.pestOrDiseaseFlag(false)
				.remarks("Healthy crop")
				.build();
		dto = GrowthObservationDto.builder()
				.planId(1)
				.officerId(2)
				.observationDate(LocalDate.of(2026, 6, 15))
				.stage(Stage.GR)
				.pestOrDiseaseFlag(false)
				.remarks("Healthy crop")
				.build();
	}

	@Test
	void getAllReturnsList() {
		when(growthObservationRepository.findAll()).thenReturn(List.of(growthObservation));

		assertThat(growthObservationService.getAll()).hasSize(1);
		verify(growthObservationRepository).findAll();
	}

	@Test
	void getByIdReturnsRecord() {
		when(growthObservationRepository.findById(1)).thenReturn(Optional.of(growthObservation));

		assertThat(growthObservationService.getById(1).getStage()).isEqualTo(Stage.GR);
	}

	@Test
	void getByIdThrowsWhenMissing() {
		when(growthObservationRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> growthObservationService.getById(99))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@Test
	void createSavesRecord() {
		when(growthObservationRepository.findByPlanId(1))
				.thenReturn(List.of(GrowthObservation.builder().stage(Stage.GR).build()));
		when(growthObservationRepository.save(any(GrowthObservation.class))).thenReturn(growthObservation);

		growthObservationService.create(dto);

		verify(growthObservationRepository).save(any(GrowthObservation.class));
	}

	@Test
	void updateModifiesRecord() {
		when(growthObservationRepository.findById(1)).thenReturn(Optional.of(growthObservation));
		when(growthObservationRepository.save(any(GrowthObservation.class))).thenReturn(growthObservation);

		growthObservationService.update(1, dto);

		verify(growthObservationRepository).save(any(GrowthObservation.class));
	}

	@Test
	void deleteRemovesRecord() {
		when(growthObservationRepository.findById(1)).thenReturn(Optional.of(growthObservation));

		growthObservationService.delete(1);

		verify(growthObservationRepository, times(1)).delete(growthObservation);
	}
}

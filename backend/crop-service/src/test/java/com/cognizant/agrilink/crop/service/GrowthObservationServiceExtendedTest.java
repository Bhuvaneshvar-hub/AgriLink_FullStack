package com.cognizant.agrilink.crop.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.crop.enums.Stage;
import com.cognizant.agrilink.crop.dto.GrowthObservationDto;
import com.cognizant.agrilink.crop.entity.GrowthObservation;
import com.cognizant.agrilink.crop.repository.GrowthObservationRepository;
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
class GrowthObservationServiceExtendedTest {

	@Mock
	private GrowthObservationRepository growthObservationRepository;

	@InjectMocks
	private GrowthObservationService growthObservationService;

	private GrowthObservation buildGrowthObservation() {
		return GrowthObservation.builder()
				.observationId(1)
				.planId(1)
				.officerId(2)
				.observationDate(LocalDate.of(2026, 6, 15))
				.stage(Stage.GR)
				.pestOrDiseaseFlag(false)
				.remarks("Healthy crop")
				.build();
	}

	private GrowthObservationDto buildDto() {
		return GrowthObservationDto.builder()
				.planId(1)
				.officerId(2)
				.observationDate(LocalDate.of(2026, 6, 15))
				.stage(Stage.GR)
				.pestOrDiseaseFlag(false)
				.remarks("Healthy crop")
				.build();
	}

	@Test
	void getAllReturnsEmptyList() {
		when(growthObservationRepository.findAll()).thenReturn(Collections.emptyList());

		assertThat(growthObservationService.getAll()).isEmpty();
		verify(growthObservationRepository).findAll();
	}

	@Test
	void getAllReturnsManyRecords() {
		when(growthObservationRepository.findAll())
				.thenReturn(List.of(buildGrowthObservation(), buildGrowthObservation(), buildGrowthObservation()));

		assertThat(growthObservationService.getAll()).hasSize(3);
	}

	@Test
	void getByIdReturnsCorrectFields() {
		when(growthObservationRepository.findById(1)).thenReturn(Optional.of(buildGrowthObservation()));

		GrowthObservation result = growthObservationService.getById(1);

		assertThat(result.getStage()).isEqualTo(Stage.GR);
		assertThat(result.getPestOrDiseaseFlag()).isFalse();
		assertThat(result.getObservationDate()).isEqualTo(LocalDate.of(2026, 6, 15));
	}

	@Test
	void getByIdThrowsWithMessage() {
		when(growthObservationRepository.findById(60)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> growthObservationService.getById(60))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessageContaining("60");
	}

	@Test
	void createMapsAllFields() {
		ArgumentCaptor<GrowthObservation> captor = ArgumentCaptor.forClass(GrowthObservation.class);
		when(growthObservationRepository.findByPlanId(1))
				.thenReturn(List.of(GrowthObservation.builder().stage(Stage.GR).build()));
		when(growthObservationRepository.save(any(GrowthObservation.class))).thenReturn(buildGrowthObservation());

		growthObservationService.create(buildDto());

		verify(growthObservationRepository).save(captor.capture());
		GrowthObservation saved = captor.getValue();
		assertThat(saved.getPlanId()).isEqualTo(1);
		assertThat(saved.getOfficerId()).isEqualTo(2);
		assertThat(saved.getObservationDate()).isEqualTo(LocalDate.of(2026, 6, 15));
		assertThat(saved.getStage()).isEqualTo(Stage.GR);
		assertThat(saved.getPestOrDiseaseFlag()).isFalse();
		assertThat(saved.getRemarks()).isEqualTo("Healthy crop");
	}

	@Test
	void updateModifiesEachField() {
		GrowthObservation existing = buildGrowthObservation();
		ArgumentCaptor<GrowthObservation> captor = ArgumentCaptor.forClass(GrowthObservation.class);
		when(growthObservationRepository.findById(1)).thenReturn(Optional.of(existing));
		when(growthObservationRepository.save(any(GrowthObservation.class))).thenReturn(existing);

		GrowthObservationDto dto = GrowthObservationDto.builder()
				.planId(9)
				.officerId(8)
				.observationDate(LocalDate.of(2027, 3, 20))
				.stage(Stage.PL)
				.pestOrDiseaseFlag(true)
				.remarks("Pest detected")
				.build();

		growthObservationService.update(1, dto);

		verify(growthObservationRepository).save(captor.capture());
		GrowthObservation saved = captor.getValue();
		assertThat(saved.getPlanId()).isEqualTo(9);
		assertThat(saved.getOfficerId()).isEqualTo(8);
		assertThat(saved.getObservationDate()).isEqualTo(LocalDate.of(2027, 3, 20));
		assertThat(saved.getStage()).isEqualTo(Stage.PL);
		assertThat(saved.getPestOrDiseaseFlag()).isTrue();
		assertThat(saved.getRemarks()).isEqualTo("Pest detected");
	}

	@Test
	void updateThrowsWhenMissing() {
		when(growthObservationRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> growthObservationService.update(99, buildDto()))
				.isInstanceOf(EntityNotFoundException.class);
		verify(growthObservationRepository, never()).save(any(GrowthObservation.class));
	}

	@Test
	void deleteThrowsWhenMissing() {
		when(growthObservationRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> growthObservationService.delete(99))
				.isInstanceOf(EntityNotFoundException.class);
		verify(growthObservationRepository, never()).delete(any(GrowthObservation.class));
	}

	@Test
	void deleteInvokesRepositoryDelete() {
		GrowthObservation existing = buildGrowthObservation();
		when(growthObservationRepository.findById(1)).thenReturn(Optional.of(existing));

		growthObservationService.delete(1);

		verify(growthObservationRepository, times(1)).delete(existing);
	}

	@ParameterizedTest
	@ValueSource(ints = { 1, 6, 22, 333, 9999 })
	void getByIdWithVariousIds(int id) {
		when(growthObservationRepository.findById(id)).thenReturn(Optional.of(buildGrowthObservation()));

		assertThat(growthObservationService.getById(id)).isNotNull();
		verify(growthObservationRepository).findById(id);
	}

	@ParameterizedTest
	@ValueSource(booleans = { true, false })
	void createWithBothPestFlags(boolean flag) {
		ArgumentCaptor<GrowthObservation> captor = ArgumentCaptor.forClass(GrowthObservation.class);
		when(growthObservationRepository.findByPlanId(1))
				.thenReturn(List.of(GrowthObservation.builder().stage(Stage.GR).build()));
		when(growthObservationRepository.save(any(GrowthObservation.class))).thenReturn(buildGrowthObservation());

		GrowthObservationDto dto = buildDto();
		dto.setPestOrDiseaseFlag(flag);
		growthObservationService.create(dto);

		verify(growthObservationRepository).save(captor.capture());
		assertThat(captor.getValue().getPestOrDiseaseFlag()).isEqualTo(flag);
	}

	@ParameterizedTest
	@EnumSource(Stage.class)
	void createWithVariousStages(Stage stage) {
		ArgumentCaptor<GrowthObservation> captor = ArgumentCaptor.forClass(GrowthObservation.class);
		when(growthObservationRepository.findByPlanId(1))
				.thenReturn(List.of(GrowthObservation.builder().stage(stage).build()));
		when(growthObservationRepository.save(any(GrowthObservation.class))).thenReturn(buildGrowthObservation());

		GrowthObservationDto dto = buildDto();
		dto.setStage(stage);
		growthObservationService.create(dto);

		verify(growthObservationRepository).save(captor.capture());
		assertThat(captor.getValue().getStage()).isEqualTo(stage);
	}

	@ParameterizedTest
	@ValueSource(strings = { "2025-01-01", "2026-06-15", "2026-12-31", "2027-08-09" })
	void createWithVariousDates(String date) {
		ArgumentCaptor<GrowthObservation> captor = ArgumentCaptor.forClass(GrowthObservation.class);
		when(growthObservationRepository.findByPlanId(1))
				.thenReturn(List.of(GrowthObservation.builder().stage(Stage.GR).build()));
		when(growthObservationRepository.save(any(GrowthObservation.class))).thenReturn(buildGrowthObservation());

		GrowthObservationDto dto = buildDto();
		dto.setObservationDate(LocalDate.parse(date));
		growthObservationService.create(dto);

		verify(growthObservationRepository).save(captor.capture());
		assertThat(captor.getValue().getObservationDate()).isEqualTo(LocalDate.parse(date));
	}

	@ParameterizedTest
	@CsvSource({
			"5,10,PL,true",
			"6,11,SO,false",
			"7,12,GR,true"
	})
	void createWithCsvData(int planId, int officerId, Stage stage, boolean flag) {
		ArgumentCaptor<GrowthObservation> captor = ArgumentCaptor.forClass(GrowthObservation.class);
		when(growthObservationRepository.findByPlanId(planId))
				.thenReturn(List.of(GrowthObservation.builder().stage(stage).build()));
		when(growthObservationRepository.save(any(GrowthObservation.class))).thenReturn(buildGrowthObservation());

		GrowthObservationDto dto = buildDto();
		dto.setPlanId(planId);
		dto.setOfficerId(officerId);
		dto.setStage(stage);
		dto.setPestOrDiseaseFlag(flag);
		growthObservationService.create(dto);

		verify(growthObservationRepository).save(captor.capture());
		GrowthObservation saved = captor.getValue();
		assertThat(saved.getPlanId()).isEqualTo(planId);
		assertThat(saved.getOfficerId()).isEqualTo(officerId);
		assertThat(saved.getStage()).isEqualTo(stage);
		assertThat(saved.getPestOrDiseaseFlag()).isEqualTo(flag);
	}
}

package com.cognizant.agrilink.subsidy.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.subsidy.dto.SubsidyApplicationDto;
import com.cognizant.agrilink.subsidy.entity.SubsidyApplication;
import com.cognizant.agrilink.subsidy.enums.ApplicationStatus;
import com.cognizant.agrilink.subsidy.repository.SubsidyApplicationRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
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
class SubsidyApplicationServiceExtendedTest {

	@Mock
	private SubsidyApplicationRepository subsidyApplicationRepository;

	@InjectMocks
	private SubsidyApplicationService subsidyApplicationService;

	private SubsidyApplication subsidyApplication;
	private SubsidyApplicationDto dto;

	@BeforeEach
	void setUp() {
		subsidyApplication = SubsidyApplication.builder()
				.applicationId(1)
				.farmerId(1)
				.schemeId(1)
				.applicationDate(LocalDate.of(2026, 2, 1))
				.eligibilityScore(85.5)
				.reviewedBy(2)
				.disbursedAmount(6000.0)
				.disbursedDate(LocalDate.of(2026, 3, 1))
				.status(ApplicationStatus.AP)
				.build();
		dto = SubsidyApplicationDto.builder()
				.farmerId(1)
				.schemeId(1)
				.applicationDate(LocalDate.of(2026, 2, 1))
				.eligibilityScore(85.5)
				.reviewedBy(2)
				.disbursedAmount(6000.0)
				.disbursedDate(LocalDate.of(2026, 3, 1))
				.status(ApplicationStatus.AP)
				.build();
	}

	@ParameterizedTest
	@EnumSource(ApplicationStatus.class)
	void createPersistsVariousStatuses(ApplicationStatus status) {
		dto.setStatus(status);
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.create(dto);

		ArgumentCaptor<SubsidyApplication> captor = ArgumentCaptor.forClass(SubsidyApplication.class);
		verify(subsidyApplicationRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.5, 50.0, 99.99, 100.0})
	void createPersistsBoundaryEligibilityScores(double score) {
		dto.setEligibilityScore(score);
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.create(dto);

		ArgumentCaptor<SubsidyApplication> captor = ArgumentCaptor.forClass(SubsidyApplication.class);
		verify(subsidyApplicationRepository).save(captor.capture());
		assertThat(captor.getValue().getEligibilityScore()).isEqualTo(score);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 100, 9999, 2147483647})
	void createPersistsVariousFarmerIds(int farmerId) {
		dto.setFarmerId(farmerId);
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.create(dto);

		ArgumentCaptor<SubsidyApplication> captor = ArgumentCaptor.forClass(SubsidyApplication.class);
		verify(subsidyApplicationRepository).save(captor.capture());
		assertThat(captor.getValue().getFarmerId()).isEqualTo(farmerId);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 1500.0, 6000.0, 250000.0})
	void createPersistsVariousDisbursedAmounts(double amount) {
		dto.setDisbursedAmount(amount);
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.create(dto);

		ArgumentCaptor<SubsidyApplication> captor = ArgumentCaptor.forClass(SubsidyApplication.class);
		verify(subsidyApplicationRepository).save(captor.capture());
		assertThat(captor.getValue().getDisbursedAmount()).isEqualTo(amount);
	}

	@ParameterizedTest
	@CsvSource({
		"1,2,PE",
		"5,10,PE",
		"99,3,DB"
	})
	void createPersistsIdsAndStatus(int farmerId, int reviewedBy, ApplicationStatus status) {
		dto.setFarmerId(farmerId);
		dto.setReviewedBy(reviewedBy);
		dto.setStatus(status);
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.create(dto);

		ArgumentCaptor<SubsidyApplication> captor = ArgumentCaptor.forClass(SubsidyApplication.class);
		verify(subsidyApplicationRepository).save(captor.capture());
		assertThat(captor.getValue().getFarmerId()).isEqualTo(farmerId);
		assertThat(captor.getValue().getReviewedBy()).isEqualTo(reviewedBy);
		assertThat(captor.getValue().getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(ints = {2, 50, 500, 9999})
	void getByIdThrowsForVariousMissingIds(int id) {
		when(subsidyApplicationRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> subsidyApplicationService.getById(id))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("Subsidy application not found with id " + id);
	}

	@Test
	void getAllEmptyReturnsEmptyList() {
		when(subsidyApplicationRepository.findAll()).thenReturn(List.of());

		assertThat(subsidyApplicationService.getAll()).isEmpty();
		verify(subsidyApplicationRepository).findAll();
	}

	@Test
	void getAllManyReturnsAll() {
		when(subsidyApplicationRepository.findAll())
				.thenReturn(List.of(subsidyApplication, subsidyApplication, subsidyApplication));

		assertThat(subsidyApplicationService.getAll()).hasSize(3);
	}

	@Test
	void getByIdReturnsAllFields() {
		when(subsidyApplicationRepository.findById(1)).thenReturn(Optional.of(subsidyApplication));

		SubsidyApplication found = subsidyApplicationService.getById(1);

		assertThat(found.getFarmerId()).isEqualTo(1);
		assertThat(found.getEligibilityScore()).isEqualTo(85.5);
		assertThat(found.getDisbursedAmount()).isEqualTo(6000.0);
		assertThat(found.getStatus()).isEqualTo(ApplicationStatus.AP);
	}

	@Test
	void getByIdThrowsWithExactMessage() {
		when(subsidyApplicationRepository.findById(77)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> subsidyApplicationService.getById(77))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("Subsidy application not found with id 77");
	}

	@Test
	void createReturnsSavedEntity() {
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		SubsidyApplication result = subsidyApplicationService.create(dto);

		assertThat(result.getApplicationId()).isEqualTo(1);
	}

	@Test
	void createCapturesFarmerId() {
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.create(dto);

		ArgumentCaptor<SubsidyApplication> captor = ArgumentCaptor.forClass(SubsidyApplication.class);
		verify(subsidyApplicationRepository).save(captor.capture());
		assertThat(captor.getValue().getFarmerId()).isEqualTo(1);
	}

	@Test
	void createCapturesSchemeId() {
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.create(dto);

		ArgumentCaptor<SubsidyApplication> captor = ArgumentCaptor.forClass(SubsidyApplication.class);
		verify(subsidyApplicationRepository).save(captor.capture());
		assertThat(captor.getValue().getSchemeId()).isEqualTo(1);
	}

	@Test
	void createCapturesApplicationDate() {
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.create(dto);

		ArgumentCaptor<SubsidyApplication> captor = ArgumentCaptor.forClass(SubsidyApplication.class);
		verify(subsidyApplicationRepository).save(captor.capture());
		assertThat(captor.getValue().getApplicationDate()).isEqualTo(LocalDate.of(2026, 2, 1));
	}

	@Test
	void createCapturesReviewedByAndDisbursedDate() {
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.create(dto);

		ArgumentCaptor<SubsidyApplication> captor = ArgumentCaptor.forClass(SubsidyApplication.class);
		verify(subsidyApplicationRepository).save(captor.capture());
		assertThat(captor.getValue().getReviewedBy()).isEqualTo(2);
		assertThat(captor.getValue().getDisbursedDate()).isEqualTo(LocalDate.of(2026, 3, 1));
	}

	@Test
	void updateCapturesFarmerId() {
		dto.setFarmerId(42);
		when(subsidyApplicationRepository.findById(1)).thenReturn(Optional.of(subsidyApplication));
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.update(1, dto);

		ArgumentCaptor<SubsidyApplication> captor = ArgumentCaptor.forClass(SubsidyApplication.class);
		verify(subsidyApplicationRepository).save(captor.capture());
		assertThat(captor.getValue().getFarmerId()).isEqualTo(42);
	}

	@Test
	void updateCapturesEligibilityScore() {
		dto.setEligibilityScore(95.0);
		when(subsidyApplicationRepository.findById(1)).thenReturn(Optional.of(subsidyApplication));
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.update(1, dto);

		ArgumentCaptor<SubsidyApplication> captor = ArgumentCaptor.forClass(SubsidyApplication.class);
		verify(subsidyApplicationRepository).save(captor.capture());
		assertThat(captor.getValue().getEligibilityScore()).isEqualTo(95.0);
	}

	@Test
	void updateCapturesDisbursedAmount() {
		dto.setDisbursedAmount(9000.0);
		when(subsidyApplicationRepository.findById(1)).thenReturn(Optional.of(subsidyApplication));
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.update(1, dto);

		ArgumentCaptor<SubsidyApplication> captor = ArgumentCaptor.forClass(SubsidyApplication.class);
		verify(subsidyApplicationRepository).save(captor.capture());
		assertThat(captor.getValue().getDisbursedAmount()).isEqualTo(9000.0);
	}

	@Test
	void updateCapturesStatus() {
		dto.setStatus(ApplicationStatus.DB);
		when(subsidyApplicationRepository.findById(1)).thenReturn(Optional.of(subsidyApplication));
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.update(1, dto);

		ArgumentCaptor<SubsidyApplication> captor = ArgumentCaptor.forClass(SubsidyApplication.class);
		verify(subsidyApplicationRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(ApplicationStatus.DB);
	}

	@Test
	void updateThrowsWhenMissingAndNeverSaves() {
		when(subsidyApplicationRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> subsidyApplicationService.update(99, dto))
				.isInstanceOf(EntityNotFoundException.class);
		verify(subsidyApplicationRepository, never()).save(any(SubsidyApplication.class));
	}

	@Test
	void deleteInvokesRepositoryDelete() {
		when(subsidyApplicationRepository.findById(1)).thenReturn(Optional.of(subsidyApplication));

		subsidyApplicationService.delete(1);

		verify(subsidyApplicationRepository, times(1)).delete(subsidyApplication);
	}

	@Test
	void deleteThrowsWhenMissingAndNeverDeletes() {
		when(subsidyApplicationRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> subsidyApplicationService.delete(99))
				.isInstanceOf(EntityNotFoundException.class);
		verify(subsidyApplicationRepository, never()).delete(any(SubsidyApplication.class));
	}
}

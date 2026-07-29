package com.cognizant.agrilink.subsidy.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SubsidyApplicationServiceTest {

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

	@Test
	void getAllReturnsList() {
		when(subsidyApplicationRepository.findAll()).thenReturn(List.of(subsidyApplication));

		assertThat(subsidyApplicationService.getAll()).hasSize(1);
		verify(subsidyApplicationRepository).findAll();
	}

	@Test
	void getByIdReturnsRecord() {
		when(subsidyApplicationRepository.findById(1)).thenReturn(Optional.of(subsidyApplication));

		assertThat(subsidyApplicationService.getById(1).getStatus()).isEqualTo(ApplicationStatus.AP);
	}

	@Test
	void getByIdThrowsWhenMissing() {
		when(subsidyApplicationRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> subsidyApplicationService.getById(99))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@Test
	void createSavesRecord() {
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.create(dto);

		verify(subsidyApplicationRepository).save(any(SubsidyApplication.class));
	}

	@Test
	void updateModifiesRecord() {
		when(subsidyApplicationRepository.findById(1)).thenReturn(Optional.of(subsidyApplication));
		when(subsidyApplicationRepository.save(any(SubsidyApplication.class))).thenReturn(subsidyApplication);

		subsidyApplicationService.update(1, dto);

		verify(subsidyApplicationRepository).save(any(SubsidyApplication.class));
	}

	@Test
	void deleteRemovesRecord() {
		when(subsidyApplicationRepository.findById(1)).thenReturn(Optional.of(subsidyApplication));

		subsidyApplicationService.delete(1);

		verify(subsidyApplicationRepository, times(1)).delete(subsidyApplication);
	}
}

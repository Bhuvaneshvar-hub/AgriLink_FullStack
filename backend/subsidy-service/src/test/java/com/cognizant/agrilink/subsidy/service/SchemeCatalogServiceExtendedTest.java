package com.cognizant.agrilink.subsidy.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.subsidy.dto.SchemeCatalogDto;
import com.cognizant.agrilink.subsidy.entity.SchemeCatalog;
import com.cognizant.agrilink.subsidy.enums.Status;
import com.cognizant.agrilink.subsidy.repository.SchemeCatalogRepository;
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
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SchemeCatalogServiceExtendedTest {

	@Mock
	private SchemeCatalogRepository schemeCatalogRepository;

	@InjectMocks
	private SchemeCatalogService schemeCatalogService;

	private SchemeCatalog schemeCatalog;
	private SchemeCatalogDto dto;

	@BeforeEach
	void setUp() {
		schemeCatalog = SchemeCatalog.builder()
				.schemeId(1)
				.schemeName("PM Kisan")
				.category("InputSubsidy")
				.eligibilityCriteria("Small and marginal farmers")
				.benefitAmount(6000.0)
				.fundingSource("Central")
				.startDate(LocalDate.of(2026, 1, 1))
				.endDate(LocalDate.of(2026, 12, 31))
				.status(Status.AC)
				.build();
		dto = SchemeCatalogDto.builder()
				.schemeName("PM Kisan")
				.category("InputSubsidy")
				.eligibilityCriteria("Small and marginal farmers")
				.benefitAmount(6000.0)
				.fundingSource("Central")
				.startDate(LocalDate.of(2026, 1, 1))
				.endDate(LocalDate.of(2026, 12, 31))
				.status(Status.AC)
				.build();
	}

	@ParameterizedTest
	@EnumSource(Status.class)
	void createPersistsVariousStatuses(Status status) {
		dto.setStatus(status);
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.create(dto);

		ArgumentCaptor<SchemeCatalog> captor = ArgumentCaptor.forClass(SchemeCatalog.class);
		verify(schemeCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(strings = {"InputSubsidy", "CropInsurance", "EquipmentGrant", "WelfareSupport"})
	void createPersistsVariousCategories(String category) {
		dto.setCategory(category);
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.create(dto);

		ArgumentCaptor<SchemeCatalog> captor = ArgumentCaptor.forClass(SchemeCatalog.class);
		verify(schemeCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getCategory()).isEqualTo(category);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.01, 1000.0, 99999.99, 1000000.0})
	void createPersistsBoundaryBenefitAmounts(double amount) {
		dto.setBenefitAmount(amount);
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.create(dto);

		ArgumentCaptor<SchemeCatalog> captor = ArgumentCaptor.forClass(SchemeCatalog.class);
		verify(schemeCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getBenefitAmount()).isEqualTo(amount);
	}

	@ParameterizedTest
	@NullAndEmptySource
	void createPersistsBlankOrNullSchemeName(String schemeName) {
		dto.setSchemeName(schemeName);
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.create(dto);

		ArgumentCaptor<SchemeCatalog> captor = ArgumentCaptor.forClass(SchemeCatalog.class);
		verify(schemeCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getSchemeName()).isEqualTo(schemeName);
	}

	@ParameterizedTest
	@CsvSource({
		"PM Kisan,Central,AC",
		"Crop Insurance,State,IN",
		"Equipment Grant,Mixed,IN"
	})
	void createPersistsNameSourceStatus(String name, String fundingSource, Status status) {
		dto.setSchemeName(name);
		dto.setFundingSource(fundingSource);
		dto.setStatus(status);
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.create(dto);

		ArgumentCaptor<SchemeCatalog> captor = ArgumentCaptor.forClass(SchemeCatalog.class);
		verify(schemeCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getSchemeName()).isEqualTo(name);
		assertThat(captor.getValue().getFundingSource()).isEqualTo(fundingSource);
		assertThat(captor.getValue().getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(ints = {2, 50, 500, 9999})
	void getByIdThrowsForVariousMissingIds(int id) {
		when(schemeCatalogRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> schemeCatalogService.getById(id))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("Scheme not found with id " + id);
	}

	@Test
	void getAllEmptyReturnsEmptyList() {
		when(schemeCatalogRepository.findAll()).thenReturn(List.of());

		assertThat(schemeCatalogService.getAll()).isEmpty();
		verify(schemeCatalogRepository).findAll();
	}

	@Test
	void getAllManyReturnsAll() {
		when(schemeCatalogRepository.findAll()).thenReturn(List.of(schemeCatalog, schemeCatalog, schemeCatalog));

		assertThat(schemeCatalogService.getAll()).hasSize(3);
	}

	@Test
	void getByIdReturnsAllFields() {
		when(schemeCatalogRepository.findById(1)).thenReturn(Optional.of(schemeCatalog));

		SchemeCatalog found = schemeCatalogService.getById(1);

		assertThat(found.getSchemeName()).isEqualTo("PM Kisan");
		assertThat(found.getCategory()).isEqualTo("InputSubsidy");
		assertThat(found.getBenefitAmount()).isEqualTo(6000.0);
		assertThat(found.getStatus()).isEqualTo(Status.AC);
	}

	@Test
	void getByIdThrowsWithExactMessage() {
		when(schemeCatalogRepository.findById(77)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> schemeCatalogService.getById(77))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("Scheme not found with id 77");
	}

	@Test
	void createReturnsSavedEntity() {
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		SchemeCatalog result = schemeCatalogService.create(dto);

		assertThat(result.getSchemeId()).isEqualTo(1);
	}

	@Test
	void createCapturesSchemeName() {
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.create(dto);

		ArgumentCaptor<SchemeCatalog> captor = ArgumentCaptor.forClass(SchemeCatalog.class);
		verify(schemeCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getSchemeName()).isEqualTo("PM Kisan");
	}

	@Test
	void createCapturesEligibilityCriteria() {
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.create(dto);

		ArgumentCaptor<SchemeCatalog> captor = ArgumentCaptor.forClass(SchemeCatalog.class);
		verify(schemeCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getEligibilityCriteria()).isEqualTo("Small and marginal farmers");
	}

	@Test
	void createCapturesFundingSource() {
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.create(dto);

		ArgumentCaptor<SchemeCatalog> captor = ArgumentCaptor.forClass(SchemeCatalog.class);
		verify(schemeCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getFundingSource()).isEqualTo("Central");
	}

	@Test
	void createCapturesStartAndEndDate() {
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.create(dto);

		ArgumentCaptor<SchemeCatalog> captor = ArgumentCaptor.forClass(SchemeCatalog.class);
		verify(schemeCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getStartDate()).isEqualTo(LocalDate.of(2026, 1, 1));
		assertThat(captor.getValue().getEndDate()).isEqualTo(LocalDate.of(2026, 12, 31));
	}

	@Test
	void updateCapturesSchemeName() {
		dto.setSchemeName("Updated Scheme");
		when(schemeCatalogRepository.findById(1)).thenReturn(Optional.of(schemeCatalog));
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.update(1, dto);

		ArgumentCaptor<SchemeCatalog> captor = ArgumentCaptor.forClass(SchemeCatalog.class);
		verify(schemeCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getSchemeName()).isEqualTo("Updated Scheme");
	}

	@Test
	void updateCapturesCategory() {
		dto.setCategory("CropInsurance");
		when(schemeCatalogRepository.findById(1)).thenReturn(Optional.of(schemeCatalog));
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.update(1, dto);

		ArgumentCaptor<SchemeCatalog> captor = ArgumentCaptor.forClass(SchemeCatalog.class);
		verify(schemeCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getCategory()).isEqualTo("CropInsurance");
	}

	@Test
	void updateCapturesBenefitAmount() {
		dto.setBenefitAmount(12000.0);
		when(schemeCatalogRepository.findById(1)).thenReturn(Optional.of(schemeCatalog));
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.update(1, dto);

		ArgumentCaptor<SchemeCatalog> captor = ArgumentCaptor.forClass(SchemeCatalog.class);
		verify(schemeCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getBenefitAmount()).isEqualTo(12000.0);
	}

	@Test
	void updateCapturesStatus() {
		dto.setStatus(Status.IN);
		when(schemeCatalogRepository.findById(1)).thenReturn(Optional.of(schemeCatalog));
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.update(1, dto);

		ArgumentCaptor<SchemeCatalog> captor = ArgumentCaptor.forClass(SchemeCatalog.class);
		verify(schemeCatalogRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(Status.IN);
	}

	@Test
	void updateThrowsWhenMissingAndNeverSaves() {
		when(schemeCatalogRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> schemeCatalogService.update(99, dto))
				.isInstanceOf(EntityNotFoundException.class);
		verify(schemeCatalogRepository, never()).save(any(SchemeCatalog.class));
	}

	@Test
	void deleteInvokesRepositoryDelete() {
		when(schemeCatalogRepository.findById(1)).thenReturn(Optional.of(schemeCatalog));

		schemeCatalogService.delete(1);

		verify(schemeCatalogRepository, times(1)).delete(schemeCatalog);
	}

	@Test
	void deleteThrowsWhenMissingAndNeverDeletes() {
		when(schemeCatalogRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> schemeCatalogService.delete(99))
				.isInstanceOf(EntityNotFoundException.class);
		verify(schemeCatalogRepository, never()).delete(any(SchemeCatalog.class));
	}
}

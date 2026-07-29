package com.cognizant.agrilink.subsidy.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class SchemeCatalogServiceTest {

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
				.category("DirectBenefit")
				.eligibilityCriteria("Small and marginal farmers")
				.benefitAmount(6000.0)
				.fundingSource("Central")
				.startDate(LocalDate.of(2026, 1, 1))
				.endDate(LocalDate.of(2026, 12, 31))
				.status(Status.AC)
				.build();
		dto = SchemeCatalogDto.builder()
				.schemeName("PM Kisan")
				.category("DirectBenefit")
				.eligibilityCriteria("Small and marginal farmers")
				.benefitAmount(6000.0)
				.fundingSource("Central")
				.startDate(LocalDate.of(2026, 1, 1))
				.endDate(LocalDate.of(2026, 12, 31))
				.status(Status.AC)
				.build();
	}

	@Test
	void getAllReturnsList() {
		when(schemeCatalogRepository.findAll()).thenReturn(List.of(schemeCatalog));

		assertThat(schemeCatalogService.getAll()).hasSize(1);
		verify(schemeCatalogRepository).findAll();
	}

	@Test
	void getByIdReturnsRecord() {
		when(schemeCatalogRepository.findById(1)).thenReturn(Optional.of(schemeCatalog));

		assertThat(schemeCatalogService.getById(1).getSchemeName()).isEqualTo("PM Kisan");
	}

	@Test
	void getByIdThrowsWhenMissing() {
		when(schemeCatalogRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> schemeCatalogService.getById(99))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@Test
	void createSavesRecord() {
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.create(dto);

		verify(schemeCatalogRepository).save(any(SchemeCatalog.class));
	}

	@Test
	void updateModifiesRecord() {
		when(schemeCatalogRepository.findById(1)).thenReturn(Optional.of(schemeCatalog));
		when(schemeCatalogRepository.save(any(SchemeCatalog.class))).thenReturn(schemeCatalog);

		schemeCatalogService.update(1, dto);

		verify(schemeCatalogRepository).save(any(SchemeCatalog.class));
	}

	@Test
	void deleteRemovesRecord() {
		when(schemeCatalogRepository.findById(1)).thenReturn(Optional.of(schemeCatalog));

		schemeCatalogService.delete(1);

		verify(schemeCatalogRepository, times(1)).delete(schemeCatalog);
	}
}

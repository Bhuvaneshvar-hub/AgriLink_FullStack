package com.cognizant.agrilink.report.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.report.dto.AgriReportDto;
import com.cognizant.agrilink.report.entity.AgriReport;
import com.cognizant.agrilink.report.repository.AgriReportRepository;
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
class AgriReportServiceTest {

	@Mock
	private AgriReportRepository agriReportRepository;

	@InjectMocks
	private AgriReportService agriReportService;

	private AgriReport agriReport;
	private AgriReportDto dto;

	@BeforeEach
	void setUp() {
		agriReport = AgriReport.builder()
				.reportId(1)
				.generatedBy(1)
				.scope("District")
				.metrics("YieldSummary")
				.generatedDate(LocalDate.of(2026, 6, 15))
				.build();
		dto = AgriReportDto.builder()
				.generatedBy(1)
				.scope("District")
				.metrics("YieldSummary")
				.generatedDate(LocalDate.of(2026, 6, 15))
				.build();
	}

	@Test
	void getAllReturnsList() {
		when(agriReportRepository.findAll()).thenReturn(List.of(agriReport));

		assertThat(agriReportService.getAll()).hasSize(1);
		verify(agriReportRepository).findAll();
	}

	@Test
	void getByIdReturnsRecord() {
		when(agriReportRepository.findById(1)).thenReturn(Optional.of(agriReport));

		assertThat(agriReportService.getById(1).getScope()).isEqualTo("District");
	}

	@Test
	void getByIdThrowsWhenMissing() {
		when(agriReportRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> agriReportService.getById(99))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@Test
	void createSavesRecord() {
		when(agriReportRepository.save(any(AgriReport.class))).thenReturn(agriReport);

		agriReportService.create(dto);

		verify(agriReportRepository).save(any(AgriReport.class));
	}

	@Test
	void updateModifiesRecord() {
		when(agriReportRepository.findById(1)).thenReturn(Optional.of(agriReport));
		when(agriReportRepository.save(any(AgriReport.class))).thenReturn(agriReport);

		agriReportService.update(1, dto);

		verify(agriReportRepository).save(any(AgriReport.class));
	}

	@Test
	void deleteRemovesRecord() {
		when(agriReportRepository.findById(1)).thenReturn(Optional.of(agriReport));

		agriReportService.delete(1);

		verify(agriReportRepository, times(1)).delete(agriReport);
	}
}

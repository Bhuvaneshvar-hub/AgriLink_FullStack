package com.cognizant.agrilink.report.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.report.entity.AgriReport;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class AgriReportRepositoryTest {

	@Autowired
	private AgriReportRepository agriReportRepository;

	private AgriReport buildAgriReport() {
		return AgriReport.builder()
				.generatedBy(1)
				.scope("District")
				.metrics("YieldSummary")
				.generatedDate(LocalDate.of(2026, 6, 15))
				.build();
	}

	@Test
	void saveAndFindById() {
		AgriReport saved = agriReportRepository.save(buildAgriReport());

		AgriReport found = agriReportRepository.findById(saved.getReportId()).orElseThrow();

		assertThat(found.getScope()).isEqualTo("District");
		assertThat(found.getMetrics()).isEqualTo("YieldSummary");
	}

	@Test
	void findAllReturnsSavedRecords() {
		agriReportRepository.save(buildAgriReport());
		agriReportRepository.save(buildAgriReport());

		assertThat(agriReportRepository.findAll()).hasSize(2);
	}

	@Test
	void deleteRemovesRecord() {
		AgriReport saved = agriReportRepository.save(buildAgriReport());

		agriReportRepository.deleteById(saved.getReportId());

		assertThat(agriReportRepository.findById(saved.getReportId())).isEmpty();
	}
}

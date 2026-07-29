package com.cognizant.agrilink.report.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.report.entity.AgriReport;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class AgriReportRepositoryExtendedTest {

	@Autowired
	private AgriReportRepository agriReportRepository;

	private AgriReport build(Integer generatedBy, String scope, String metrics, LocalDate date) {
		return AgriReport.builder()
				.generatedBy(generatedBy)
				.scope(scope)
				.metrics(metrics)
				.generatedDate(date)
				.build();
	}

	@ParameterizedTest
	@ValueSource(strings = {"District", "Crop", "Season", "Scheme", "Region", "Block", "Village", "Mandal"})
	void savePersistsScope(String scope) {
		AgriReport saved = agriReportRepository.save(build(1, scope, "YieldSummary", LocalDate.of(2026, 6, 15)));

		AgriReport found = agriReportRepository.findById(saved.getReportId()).orElseThrow();
		assertThat(found.getScope()).isEqualTo(scope);
	}

	@ParameterizedTest
	@ValueSource(strings = {
			"RegisteredFarmers=1200",
			"TotalAreaCovered=540ha",
			"EstimatedYield=3.2t",
			"SubsidyDisbursed=50000",
			"IrrigationCoverage=80%",
			"CropDiversity=High"
	})
	void savePersistsMetrics(String metrics) {
		AgriReport saved = agriReportRepository.save(build(1, "District", metrics, LocalDate.of(2026, 6, 15)));

		assertThat(agriReportRepository.findById(saved.getReportId()).orElseThrow().getMetrics()).isEqualTo(metrics);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 0, -1, 999999, 42, 7})
	void savePersistsGeneratedBy(int generatedBy) {
		AgriReport saved = agriReportRepository.save(build(generatedBy, "District", "m", LocalDate.of(2026, 6, 15)));

		assertThat(agriReportRepository.findById(saved.getReportId()).orElseThrow().getGeneratedBy())
				.isEqualTo(generatedBy);
	}

	@ParameterizedTest
	@MethodSource("dates")
	void savePersistsGeneratedDate(LocalDate date) {
		AgriReport saved = agriReportRepository.save(build(1, "District", "m", date));

		assertThat(agriReportRepository.findById(saved.getReportId()).orElseThrow().getGeneratedDate())
				.isEqualTo(date);
	}

	static Stream<LocalDate> dates() {
		return Stream.of(
				LocalDate.of(2020, 1, 1),
				LocalDate.of(2024, 2, 29),
				LocalDate.of(2026, 6, 15),
				LocalDate.of(2030, 12, 31),
				LocalDate.of(1999, 7, 4),
				LocalDate.of(2000, 2, 29)
		);
	}

	@ParameterizedTest
	@NullAndEmptySource
	@ValueSource(strings = {"   "})
	void savePersistsBlankOrNullScope(String scope) {
		AgriReport saved = agriReportRepository.save(build(1, scope, "m", LocalDate.of(2026, 6, 15)));

		assertThat(agriReportRepository.findById(saved.getReportId()).orElseThrow().getScope()).isEqualTo(scope);
	}

	@ParameterizedTest
	@NullAndEmptySource
	void savePersistsNullOrEmptyMetrics(String metrics) {
		AgriReport saved = agriReportRepository.save(build(1, "District", metrics, LocalDate.of(2026, 6, 15)));

		assertThat(agriReportRepository.findById(saved.getReportId()).orElseThrow().getMetrics()).isEqualTo(metrics);
	}

	@Test
	void saveAssignsGeneratedId() {
		AgriReport saved = agriReportRepository.save(build(1, "District", "m", LocalDate.of(2026, 6, 15)));

		assertThat(saved.getReportId()).isNotNull();
	}

	@Test
	void saveAllPersistsMultiple() {
		List<AgriReport> saved = agriReportRepository.saveAll(List.of(
				build(1, "District", "m1", LocalDate.of(2026, 6, 15)),
				build(2, "Crop", "m2", LocalDate.of(2026, 6, 16)),
				build(3, "Season", "m3", LocalDate.of(2026, 6, 17))
		));

		assertThat(saved).hasSize(3);
		assertThat(agriReportRepository.findAll()).hasSize(3);
	}

	@Test
	void findAllEmptyWhenNoRecords() {
		assertThat(agriReportRepository.findAll()).isEmpty();
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 5, 10})
	void findAllReturnsExpectedSize(int count) {
		for (int i = 0; i < count; i++) {
			agriReportRepository.save(build(i, "District", "m" + i, LocalDate.of(2026, 6, 15)));
		}

		assertThat(agriReportRepository.findAll()).hasSize(count);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 3, 7})
	void countReflectsSavedRecords(int count) {
		for (int i = 0; i < count; i++) {
			agriReportRepository.save(build(i, "Crop", "m" + i, LocalDate.of(2026, 6, 15)));
		}

		assertThat(agriReportRepository.count()).isEqualTo(count);
	}

	@Test
	void countIsZeroInitially() {
		assertThat(agriReportRepository.count()).isZero();
	}

	@Test
	void existsByIdTrueForSaved() {
		AgriReport saved = agriReportRepository.save(build(1, "District", "m", LocalDate.of(2026, 6, 15)));

		assertThat(agriReportRepository.existsById(saved.getReportId())).isTrue();
	}

	@ParameterizedTest
	@ValueSource(ints = {999, 12345, 8888})
	void existsByIdFalseForMissing(int id) {
		assertThat(agriReportRepository.existsById(id)).isFalse();
	}

	@Test
	void findByIdEmptyForMissing() {
		assertThat(agriReportRepository.findById(424242)).isEmpty();
	}

	@ParameterizedTest
	@CsvSource({
			"District, RegisteredFarmers=10",
			"Crop, TotalAreaCovered=20",
			"Season, EstimatedYield=30",
			"Scheme, SubsidyDisbursed=40"
	})
	void updateChangesFields(String scope, String metrics) {
		AgriReport saved = agriReportRepository.save(build(1, "Initial", "InitialMetrics", LocalDate.of(2020, 1, 1)));

		saved.setScope(scope);
		saved.setMetrics(metrics);
		AgriReport updated = agriReportRepository.save(saved);

		AgriReport found = agriReportRepository.findById(updated.getReportId()).orElseThrow();
		assertThat(found.getScope()).isEqualTo(scope);
		assertThat(found.getMetrics()).isEqualTo(metrics);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 3, 4})
	void deleteByIdRemovesRecord(int generatedBy) {
		AgriReport saved = agriReportRepository.save(build(generatedBy, "District", "m", LocalDate.of(2026, 6, 15)));

		agriReportRepository.deleteById(saved.getReportId());

		assertThat(agriReportRepository.findById(saved.getReportId())).isEmpty();
	}

	@Test
	void deleteEntityRemovesRecord() {
		AgriReport saved = agriReportRepository.save(build(1, "District", "m", LocalDate.of(2026, 6, 15)));

		agriReportRepository.delete(saved);

		assertThat(agriReportRepository.existsById(saved.getReportId())).isFalse();
	}

	@Test
	void deleteAllRemovesEverything() {
		agriReportRepository.saveAll(List.of(
				build(1, "District", "m1", LocalDate.of(2026, 6, 15)),
				build(2, "Crop", "m2", LocalDate.of(2026, 6, 16))
		));

		agriReportRepository.deleteAll();

		assertThat(agriReportRepository.count()).isZero();
	}

	@ParameterizedTest
	@CsvSource({
			"1, District, RegisteredFarmers=100, 2026-06-15",
			"2, Crop, TotalAreaCovered=200, 2024-02-29",
			"3, Season, EstimatedYield=300, 2030-12-31",
			"4, Scheme, SubsidyDisbursed=400, 1999-07-04"
	})
	void saveAndReadBackAllFields(int generatedBy, String scope, String metrics, String date) {
		AgriReport saved = agriReportRepository.save(build(generatedBy, scope, metrics, LocalDate.parse(date)));

		AgriReport found = agriReportRepository.findById(saved.getReportId()).orElseThrow();
		assertThat(found.getGeneratedBy()).isEqualTo(generatedBy);
		assertThat(found.getScope()).isEqualTo(scope);
		assertThat(found.getMetrics()).isEqualTo(metrics);
		assertThat(found.getGeneratedDate()).isEqualTo(LocalDate.parse(date));
	}

	@Test
	void saveNullGeneratedByPersists() {
		AgriReport saved = agriReportRepository.save(build(null, "District", "m", LocalDate.of(2026, 6, 15)));

		assertThat(agriReportRepository.findById(saved.getReportId()).orElseThrow().getGeneratedBy()).isNull();
	}

	@Test
	void saveNullDatePersists() {
		AgriReport saved = agriReportRepository.save(build(1, "District", "m", null));

		assertThat(agriReportRepository.findById(saved.getReportId()).orElseThrow().getGeneratedDate()).isNull();
	}
}

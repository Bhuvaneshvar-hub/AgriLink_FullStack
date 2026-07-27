package com.cognizant.agrilink.report.entity;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class AgriReportEntityTest {

	@Test
	void noArgsConstructorCreatesEmptyEntity() {
		AgriReport report = new AgriReport();

		assertThat(report.getReportId()).isNull();
		assertThat(report.getGeneratedBy()).isNull();
		assertThat(report.getScope()).isNull();
		assertThat(report.getMetrics()).isNull();
		assertThat(report.getGeneratedDate()).isNull();
	}

	@Test
	void allArgsConstructorSetsAllFields() {
		AgriReport report = new AgriReport(1, 2, "District", "YieldSummary", LocalDate.of(2026, 6, 15));

		assertThat(report.getReportId()).isEqualTo(1);
		assertThat(report.getGeneratedBy()).isEqualTo(2);
		assertThat(report.getScope()).isEqualTo("District");
		assertThat(report.getMetrics()).isEqualTo("YieldSummary");
		assertThat(report.getGeneratedDate()).isEqualTo(LocalDate.of(2026, 6, 15));
	}

	@Test
	void builderCreatesEntity() {
		AgriReport report = AgriReport.builder()
				.reportId(5)
				.generatedBy(10)
				.scope("Crop")
				.metrics("TotalAreaCovered=100")
				.generatedDate(LocalDate.of(2024, 2, 29))
				.build();

		assertThat(report.getReportId()).isEqualTo(5);
		assertThat(report.getGeneratedBy()).isEqualTo(10);
		assertThat(report.getScope()).isEqualTo("Crop");
		assertThat(report.getMetrics()).isEqualTo("TotalAreaCovered=100");
		assertThat(report.getGeneratedDate()).isEqualTo(LocalDate.of(2024, 2, 29));
	}

	@ParameterizedTest
	@ValueSource(strings = {"District", "Crop", "Season", "Scheme", "Region", "Block", "Village", "State"})
	void settersAndGettersForScope(String scope) {
		AgriReport report = new AgriReport();
		report.setScope(scope);

		assertThat(report.getScope()).isEqualTo(scope);
	}

	@ParameterizedTest
	@NullAndEmptySource
	@ValueSource(strings = {"   ", "\t"})
	void scopeAcceptsBlankAndNull(String scope) {
		AgriReport report = new AgriReport();
		report.setScope(scope);

		assertThat(report.getScope()).isEqualTo(scope);
	}

	@ParameterizedTest
	@ValueSource(strings = {
			"RegisteredFarmers=1200",
			"TotalAreaCovered=540ha",
			"EstimatedYield=3.2t",
			"SubsidyDisbursed=50000",
			"CropDiversity=High"
	})
	void settersAndGettersForMetrics(String metrics) {
		AgriReport report = new AgriReport();
		report.setMetrics(metrics);

		assertThat(report.getMetrics()).isEqualTo(metrics);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 0, -1, 999999, 42})
	void settersAndGettersForGeneratedBy(int generatedBy) {
		AgriReport report = new AgriReport();
		report.setGeneratedBy(generatedBy);

		assertThat(report.getGeneratedBy()).isEqualTo(generatedBy);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 0, -5, 123456})
	void settersAndGettersForReportId(int reportId) {
		AgriReport report = new AgriReport();
		report.setReportId(reportId);

		assertThat(report.getReportId()).isEqualTo(reportId);
	}

	@ParameterizedTest
	@MethodSource("dates")
	void settersAndGettersForGeneratedDate(LocalDate date) {
		AgriReport report = new AgriReport();
		report.setGeneratedDate(date);

		assertThat(report.getGeneratedDate()).isEqualTo(date);
	}

	static Stream<LocalDate> dates() {
		return Stream.of(
				LocalDate.of(2020, 1, 1),
				LocalDate.of(2024, 2, 29),
				LocalDate.of(2026, 6, 15),
				LocalDate.of(2030, 12, 31),
				LocalDate.of(1999, 7, 4)
		);
	}

	@ParameterizedTest
	@CsvSource({
			"1, 2, District, YieldSummary, 2026-06-15",
			"2, 3, Crop, RegisteredFarmers=10, 2024-02-29",
			"3, 4, Season, EstimatedYield=5t, 2030-01-01"
	})
	void equalsAndHashCodeForEqualEntities(int reportId, int generatedBy, String scope, String metrics, String date) {
		AgriReport first = new AgriReport(reportId, generatedBy, scope, metrics, LocalDate.parse(date));
		AgriReport second = new AgriReport(reportId, generatedBy, scope, metrics, LocalDate.parse(date));

		assertThat(first).isEqualTo(second);
		assertThat(first.hashCode()).isEqualTo(second.hashCode());
	}

	@ParameterizedTest
	@CsvSource({
			"1, District",
			"2, Crop",
			"3, Season",
			"4, Scheme"
	})
	void notEqualWhenScopeDiffers(int reportId, String scope) {
		AgriReport first = new AgriReport(reportId, 1, scope, "m", LocalDate.of(2026, 6, 15));
		AgriReport second = new AgriReport(reportId, 1, scope + "X", "m", LocalDate.of(2026, 6, 15));

		assertThat(first).isNotEqualTo(second);
	}

	@ParameterizedTest
	@ValueSource(strings = {"District", "Crop", "Season", "Scheme"})
	void toStringContainsScope(String scope) {
		AgriReport report = AgriReport.builder().scope(scope).build();

		assertThat(report.toString()).contains(scope);
	}

	@Test
	void notEqualToNull() {
		AgriReport report = AgriReport.builder().reportId(1).build();

		assertThat(report).isNotEqualTo(null);
	}
}

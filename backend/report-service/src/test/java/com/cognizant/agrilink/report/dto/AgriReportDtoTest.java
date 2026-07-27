package com.cognizant.agrilink.report.dto;

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

class AgriReportDtoTest {

	@Test
	void noArgsConstructorCreatesEmptyDto() {
		AgriReportDto dto = new AgriReportDto();

		assertThat(dto.getReportId()).isNull();
		assertThat(dto.getGeneratedBy()).isNull();
		assertThat(dto.getScope()).isNull();
		assertThat(dto.getMetrics()).isNull();
		assertThat(dto.getGeneratedDate()).isNull();
	}

	@Test
	void allArgsConstructorSetsAllFields() {
		AgriReportDto dto = new AgriReportDto(1, 2, "District", "YieldSummary", LocalDate.of(2026, 6, 15));

		assertThat(dto.getReportId()).isEqualTo(1);
		assertThat(dto.getGeneratedBy()).isEqualTo(2);
		assertThat(dto.getScope()).isEqualTo("District");
		assertThat(dto.getMetrics()).isEqualTo("YieldSummary");
		assertThat(dto.getGeneratedDate()).isEqualTo(LocalDate.of(2026, 6, 15));
	}

	@Test
	void builderCreatesDto() {
		AgriReportDto dto = AgriReportDto.builder()
				.reportId(7)
				.generatedBy(9)
				.scope("Scheme")
				.metrics("SubsidyDisbursed=50000")
				.generatedDate(LocalDate.of(2024, 2, 29))
				.build();

		assertThat(dto.getReportId()).isEqualTo(7);
		assertThat(dto.getGeneratedBy()).isEqualTo(9);
		assertThat(dto.getScope()).isEqualTo("Scheme");
		assertThat(dto.getMetrics()).isEqualTo("SubsidyDisbursed=50000");
		assertThat(dto.getGeneratedDate()).isEqualTo(LocalDate.of(2024, 2, 29));
	}

	@ParameterizedTest
	@ValueSource(strings = {"District", "Crop", "Season", "Scheme", "Region", "Mandal", "Taluk", "Panchayat"})
	void settersAndGettersForScope(String scope) {
		AgriReportDto dto = new AgriReportDto();
		dto.setScope(scope);

		assertThat(dto.getScope()).isEqualTo(scope);
	}

	@ParameterizedTest
	@NullAndEmptySource
	@ValueSource(strings = {"  ", "\n"})
	void scopeAcceptsBlankAndNull(String scope) {
		AgriReportDto dto = new AgriReportDto();
		dto.setScope(scope);

		assertThat(dto.getScope()).isEqualTo(scope);
	}

	@ParameterizedTest
	@ValueSource(strings = {
			"RegisteredFarmers=1200",
			"TotalAreaCovered=540ha",
			"EstimatedYield=3.2t",
			"SubsidyDisbursed=50000",
			"IrrigationCoverage=80%"
	})
	void settersAndGettersForMetrics(String metrics) {
		AgriReportDto dto = new AgriReportDto();
		dto.setMetrics(metrics);

		assertThat(dto.getMetrics()).isEqualTo(metrics);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 0, -1, 999999, 7})
	void settersAndGettersForGeneratedBy(int generatedBy) {
		AgriReportDto dto = new AgriReportDto();
		dto.setGeneratedBy(generatedBy);

		assertThat(dto.getGeneratedBy()).isEqualTo(generatedBy);
	}

	@ParameterizedTest
	@MethodSource("dates")
	void settersAndGettersForGeneratedDate(LocalDate date) {
		AgriReportDto dto = new AgriReportDto();
		dto.setGeneratedDate(date);

		assertThat(dto.getGeneratedDate()).isEqualTo(date);
	}

	static Stream<LocalDate> dates() {
		return Stream.of(
				LocalDate.of(2020, 1, 1),
				LocalDate.of(2024, 2, 29),
				LocalDate.of(2026, 6, 15),
				LocalDate.of(2031, 11, 30),
				LocalDate.of(2000, 2, 29)
		);
	}

	@ParameterizedTest
	@CsvSource({
			"1, 2, District, YieldSummary, 2026-06-15",
			"2, 3, Crop, RegisteredFarmers=10, 2024-02-29",
			"3, 4, Season, EstimatedYield=5t, 2030-01-01"
	})
	void equalsAndHashCodeForEqualDtos(int reportId, int generatedBy, String scope, String metrics, String date) {
		AgriReportDto first = new AgriReportDto(reportId, generatedBy, scope, metrics, LocalDate.parse(date));
		AgriReportDto second = new AgriReportDto(reportId, generatedBy, scope, metrics, LocalDate.parse(date));

		assertThat(first).isEqualTo(second);
		assertThat(first.hashCode()).isEqualTo(second.hashCode());
	}

	@ParameterizedTest
	@CsvSource({
			"District, Crop",
			"Season, Scheme",
			"Region, Block"
	})
	void notEqualWhenScopeDiffers(String scopeA, String scopeB) {
		AgriReportDto first = AgriReportDto.builder().scope(scopeA).build();
		AgriReportDto second = AgriReportDto.builder().scope(scopeB).build();

		assertThat(first).isNotEqualTo(second);
	}

	@ParameterizedTest
	@ValueSource(strings = {"District", "Crop", "Season", "Scheme"})
	void toStringContainsScope(String scope) {
		AgriReportDto dto = AgriReportDto.builder().scope(scope).build();

		assertThat(dto.toString()).contains(scope);
	}

	@Test
	void notEqualToNull() {
		AgriReportDto dto = AgriReportDto.builder().reportId(1).build();

		assertThat(dto).isNotEqualTo(null);
	}
}

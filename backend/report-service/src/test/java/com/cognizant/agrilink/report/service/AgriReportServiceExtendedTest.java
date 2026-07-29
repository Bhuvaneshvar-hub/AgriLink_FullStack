package com.cognizant.agrilink.report.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.report.dto.AgriReportDto;
import com.cognizant.agrilink.report.entity.AgriReport;
import com.cognizant.agrilink.report.repository.AgriReportRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AgriReportServiceExtendedTest {

	@Mock
	private AgriReportRepository agriReportRepository;

	@InjectMocks
	private AgriReportService agriReportService;

	private AgriReportDto dto(Integer generatedBy, String scope, String metrics, LocalDate date) {
		return AgriReportDto.builder()
				.generatedBy(generatedBy)
				.scope(scope)
				.metrics(metrics)
				.generatedDate(date)
				.build();
	}

	// ---------- getAll ----------

	@Test
	void getAllReturnsEmptyList() {
		when(agriReportRepository.findAll()).thenReturn(new ArrayList<>());

		assertThat(agriReportService.getAll()).isEmpty();
		verify(agriReportRepository).findAll();
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 5, 10, 25})
	void getAllReturnsManyRecords(int count) {
		List<AgriReport> records = new ArrayList<>();
		for (int i = 0; i < count; i++) {
			records.add(AgriReport.builder().reportId(i).scope("District").build());
		}
		when(agriReportRepository.findAll()).thenReturn(records);

		assertThat(agriReportService.getAll()).hasSize(count);
		verify(agriReportRepository).findAll();
	}

	// ---------- getById ----------

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 100, 999})
	void getByIdReturnsRecord(int id) {
		AgriReport report = AgriReport.builder().reportId(id).scope("District").build();
		when(agriReportRepository.findById(id)).thenReturn(Optional.of(report));

		assertThat(agriReportService.getById(id).getReportId()).isEqualTo(id);
		verify(agriReportRepository).findById(id);
	}

	@ParameterizedTest
	@ValueSource(ints = {99, 12345, 0, -1})
	void getByIdThrowsWhenMissing(int id) {
		when(agriReportRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> agriReportService.getById(id))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@ParameterizedTest
	@ValueSource(ints = {99, 7, 555})
	void getByIdExceptionMessageContainsId(int id) {
		when(agriReportRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> agriReportService.getById(id))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("AgriReport not found with id " + id);
	}

	// ---------- create ----------

	@ParameterizedTest
	@ValueSource(strings = {"District", "Crop", "Season", "Scheme", "Region", "Block", "Village", "Mandal"})
	void createMapsScope(String scope) {
		when(agriReportRepository.save(any(AgriReport.class))).thenAnswer(inv -> inv.getArgument(0));

		agriReportService.create(dto(1, scope, "m", LocalDate.of(2026, 6, 15)));

		ArgumentCaptor<AgriReport> captor = ArgumentCaptor.forClass(AgriReport.class);
		verify(agriReportRepository).save(captor.capture());
		assertThat(captor.getValue().getScope()).isEqualTo(scope);
	}

	@ParameterizedTest
	@ValueSource(strings = {
			"RegisteredFarmers=1200",
			"TotalAreaCovered=540ha",
			"EstimatedYield=3.2t",
			"SubsidyDisbursed=50000",
			"IrrigationCoverage=80%"
	})
	void createMapsMetrics(String metrics) {
		when(agriReportRepository.save(any(AgriReport.class))).thenAnswer(inv -> inv.getArgument(0));

		agriReportService.create(dto(1, "District", metrics, LocalDate.of(2026, 6, 15)));

		ArgumentCaptor<AgriReport> captor = ArgumentCaptor.forClass(AgriReport.class);
		verify(agriReportRepository).save(captor.capture());
		assertThat(captor.getValue().getMetrics()).isEqualTo(metrics);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 0, -1, 999999, 42})
	void createMapsGeneratedBy(int generatedBy) {
		when(agriReportRepository.save(any(AgriReport.class))).thenAnswer(inv -> inv.getArgument(0));

		agriReportService.create(dto(generatedBy, "District", "m", LocalDate.of(2026, 6, 15)));

		ArgumentCaptor<AgriReport> captor = ArgumentCaptor.forClass(AgriReport.class);
		verify(agriReportRepository).save(captor.capture());
		assertThat(captor.getValue().getGeneratedBy()).isEqualTo(generatedBy);
	}

	@ParameterizedTest
	@MethodSource("dates")
	void createMapsGeneratedDate(LocalDate date) {
		when(agriReportRepository.save(any(AgriReport.class))).thenAnswer(inv -> inv.getArgument(0));

		agriReportService.create(dto(1, "District", "m", date));

		ArgumentCaptor<AgriReport> captor = ArgumentCaptor.forClass(AgriReport.class);
		verify(agriReportRepository).save(captor.capture());
		assertThat(captor.getValue().getGeneratedDate()).isEqualTo(date);
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
	@NullAndEmptySource
	@ValueSource(strings = {"   "})
	void createMapsBlankOrNullScope(String scope) {
		when(agriReportRepository.save(any(AgriReport.class))).thenAnswer(inv -> inv.getArgument(0));

		agriReportService.create(dto(1, scope, "m", LocalDate.of(2026, 6, 15)));

		ArgumentCaptor<AgriReport> captor = ArgumentCaptor.forClass(AgriReport.class);
		verify(agriReportRepository).save(captor.capture());
		assertThat(captor.getValue().getScope()).isEqualTo(scope);
	}

	@Test
	void createDoesNotSetReportId() {
		when(agriReportRepository.save(any(AgriReport.class))).thenAnswer(inv -> inv.getArgument(0));

		agriReportService.create(dto(1, "District", "m", LocalDate.of(2026, 6, 15)));

		ArgumentCaptor<AgriReport> captor = ArgumentCaptor.forClass(AgriReport.class);
		verify(agriReportRepository).save(captor.capture());
		assertThat(captor.getValue().getReportId()).isNull();
	}

	@Test
	void createReturnsSavedEntity() {
		AgriReport saved = AgriReport.builder().reportId(1).scope("District").build();
		when(agriReportRepository.save(any(AgriReport.class))).thenReturn(saved);

		assertThat(agriReportService.create(dto(1, "District", "m", LocalDate.of(2026, 6, 15))))
				.isSameAs(saved);
	}

	@ParameterizedTest
	@CsvSource({
			"1, District, RegisteredFarmers=10, 2026-06-15",
			"2, Crop, TotalAreaCovered=20, 2024-02-29",
			"3, Season, EstimatedYield=30, 2030-12-31",
			"4, Scheme, SubsidyDisbursed=40, 1999-07-04"
	})
	void createMapsAllFields(int generatedBy, String scope, String metrics, String date) {
		when(agriReportRepository.save(any(AgriReport.class))).thenAnswer(inv -> inv.getArgument(0));

		agriReportService.create(dto(generatedBy, scope, metrics, LocalDate.parse(date)));

		ArgumentCaptor<AgriReport> captor = ArgumentCaptor.forClass(AgriReport.class);
		verify(agriReportRepository).save(captor.capture());
		AgriReport mapped = captor.getValue();
		assertThat(mapped.getGeneratedBy()).isEqualTo(generatedBy);
		assertThat(mapped.getScope()).isEqualTo(scope);
		assertThat(mapped.getMetrics()).isEqualTo(metrics);
		assertThat(mapped.getGeneratedDate()).isEqualTo(LocalDate.parse(date));
	}

	// ---------- update ----------

	@ParameterizedTest
	@ValueSource(strings = {"District", "Crop", "Season", "Scheme", "Region", "Block"})
	void updateMapsScope(String scope) {
		AgriReport existing = AgriReport.builder().reportId(1).scope("Old").build();
		when(agriReportRepository.findById(1)).thenReturn(Optional.of(existing));
		when(agriReportRepository.save(any(AgriReport.class))).thenAnswer(inv -> inv.getArgument(0));

		agriReportService.update(1, dto(1, scope, "m", LocalDate.of(2026, 6, 15)));

		ArgumentCaptor<AgriReport> captor = ArgumentCaptor.forClass(AgriReport.class);
		verify(agriReportRepository).save(captor.capture());
		assertThat(captor.getValue().getScope()).isEqualTo(scope);
	}

	@ParameterizedTest
	@ValueSource(strings = {
			"RegisteredFarmers=99",
			"TotalAreaCovered=88",
			"EstimatedYield=77",
			"SubsidyDisbursed=66"
	})
	void updateMapsMetrics(String metrics) {
		AgriReport existing = AgriReport.builder().reportId(1).metrics("Old").build();
		when(agriReportRepository.findById(1)).thenReturn(Optional.of(existing));
		when(agriReportRepository.save(any(AgriReport.class))).thenAnswer(inv -> inv.getArgument(0));

		agriReportService.update(1, dto(1, "District", metrics, LocalDate.of(2026, 6, 15)));

		ArgumentCaptor<AgriReport> captor = ArgumentCaptor.forClass(AgriReport.class);
		verify(agriReportRepository).save(captor.capture());
		assertThat(captor.getValue().getMetrics()).isEqualTo(metrics);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 0, -1, 999999})
	void updateMapsGeneratedBy(int generatedBy) {
		AgriReport existing = AgriReport.builder().reportId(1).generatedBy(5).build();
		when(agriReportRepository.findById(1)).thenReturn(Optional.of(existing));
		when(agriReportRepository.save(any(AgriReport.class))).thenAnswer(inv -> inv.getArgument(0));

		agriReportService.update(1, dto(generatedBy, "District", "m", LocalDate.of(2026, 6, 15)));

		ArgumentCaptor<AgriReport> captor = ArgumentCaptor.forClass(AgriReport.class);
		verify(agriReportRepository).save(captor.capture());
		assertThat(captor.getValue().getGeneratedBy()).isEqualTo(generatedBy);
	}

	@ParameterizedTest
	@MethodSource("dates")
	void updateMapsGeneratedDate(LocalDate date) {
		AgriReport existing = AgriReport.builder().reportId(1).generatedDate(LocalDate.of(2000, 1, 1)).build();
		when(agriReportRepository.findById(1)).thenReturn(Optional.of(existing));
		when(agriReportRepository.save(any(AgriReport.class))).thenAnswer(inv -> inv.getArgument(0));

		agriReportService.update(1, dto(1, "District", "m", date));

		ArgumentCaptor<AgriReport> captor = ArgumentCaptor.forClass(AgriReport.class);
		verify(agriReportRepository).save(captor.capture());
		assertThat(captor.getValue().getGeneratedDate()).isEqualTo(date);
	}

	@Test
	void updatePreservesReportId() {
		AgriReport existing = AgriReport.builder().reportId(42).scope("Old").build();
		when(agriReportRepository.findById(42)).thenReturn(Optional.of(existing));
		when(agriReportRepository.save(any(AgriReport.class))).thenAnswer(inv -> inv.getArgument(0));

		agriReportService.update(42, dto(1, "District", "m", LocalDate.of(2026, 6, 15)));

		ArgumentCaptor<AgriReport> captor = ArgumentCaptor.forClass(AgriReport.class);
		verify(agriReportRepository).save(captor.capture());
		assertThat(captor.getValue().getReportId()).isEqualTo(42);
	}

	@ParameterizedTest
	@ValueSource(ints = {99, 12345, 0})
	void updateThrowsWhenMissing(int id) {
		when(agriReportRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> agriReportService.update(id, dto(1, "District", "m", LocalDate.of(2026, 6, 15))))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@ParameterizedTest
	@ValueSource(ints = {99, 555})
	void updateNeverSavesWhenMissing(int id) {
		when(agriReportRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> agriReportService.update(id, dto(1, "District", "m", LocalDate.of(2026, 6, 15))))
				.isInstanceOf(EntityNotFoundException.class);
		verify(agriReportRepository, never()).save(any(AgriReport.class));
	}

	@ParameterizedTest
	@CsvSource({
			"1, District, RegisteredFarmers=10, 2026-06-15",
			"2, Crop, TotalAreaCovered=20, 2024-02-29",
			"3, Season, EstimatedYield=30, 2030-12-31"
	})
	void updateMapsAllFields(int generatedBy, String scope, String metrics, String date) {
		AgriReport existing = AgriReport.builder().reportId(1).scope("Old").build();
		when(agriReportRepository.findById(1)).thenReturn(Optional.of(existing));
		when(agriReportRepository.save(any(AgriReport.class))).thenAnswer(inv -> inv.getArgument(0));

		agriReportService.update(1, dto(generatedBy, scope, metrics, LocalDate.parse(date)));

		ArgumentCaptor<AgriReport> captor = ArgumentCaptor.forClass(AgriReport.class);
		verify(agriReportRepository).save(captor.capture());
		AgriReport mapped = captor.getValue();
		assertThat(mapped.getGeneratedBy()).isEqualTo(generatedBy);
		assertThat(mapped.getScope()).isEqualTo(scope);
		assertThat(mapped.getMetrics()).isEqualTo(metrics);
		assertThat(mapped.getGeneratedDate()).isEqualTo(LocalDate.parse(date));
	}

	// ---------- delete ----------

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 100, 999})
	void deleteRemovesExistingRecord(int id) {
		AgriReport existing = AgriReport.builder().reportId(id).scope("District").build();
		when(agriReportRepository.findById(id)).thenReturn(Optional.of(existing));

		agriReportService.delete(id);

		verify(agriReportRepository, times(1)).delete(existing);
	}

	@ParameterizedTest
	@ValueSource(ints = {99, 12345, 0})
	void deleteThrowsWhenMissing(int id) {
		when(agriReportRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> agriReportService.delete(id))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@ParameterizedTest
	@ValueSource(ints = {99, 555})
	void deleteNeverDeletesWhenMissing(int id) {
		when(agriReportRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> agriReportService.delete(id))
				.isInstanceOf(EntityNotFoundException.class);
		verify(agriReportRepository, never()).delete(any(AgriReport.class));
	}

	@Test
	void deleteLooksUpBeforeDeleting() {
		AgriReport existing = AgriReport.builder().reportId(1).scope("District").build();
		when(agriReportRepository.findById(1)).thenReturn(Optional.of(existing));

		agriReportService.delete(1);

		verify(agriReportRepository).findById(1);
		verify(agriReportRepository).delete(existing);
	}
}

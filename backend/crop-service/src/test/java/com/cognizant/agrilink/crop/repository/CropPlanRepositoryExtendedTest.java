package com.cognizant.agrilink.crop.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.crop.enums.PlanStatus;
import com.cognizant.agrilink.crop.entity.CropPlan;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class CropPlanRepositoryExtendedTest {

	@Autowired
	private CropPlanRepository cropPlanRepository;

	private CropPlan buildCropPlan() {
		return CropPlan.builder()
				.farmerId(1)
				.holdingId(2)
				.cropId(3)
				.season("Rabi")
				.year(2026)
				.sowingDate(LocalDate.of(2026, 1, 10))
				.expectedHarvestDate(LocalDate.of(2026, 5, 10))
				.areaPlanted(5.5)
				.status(PlanStatus.PLANNED)
				.build();
	}

	@Test
	void saveAndFindById() {
		CropPlan saved = cropPlanRepository.save(buildCropPlan());

		CropPlan found = cropPlanRepository.findById(saved.getPlanId()).orElseThrow();

		assertThat(found.getSeason()).isEqualTo("Rabi");
		assertThat(found.getYear()).isEqualTo(2026);
	}

	@Test
	void countReturnsNumberOfRecords() {
		CropPlan first = buildCropPlan();
		first.setYear(2025);
		CropPlan second = buildCropPlan();
		second.setYear(2026);
		cropPlanRepository.save(first);
		cropPlanRepository.save(second);

		assertThat(cropPlanRepository.count()).isEqualTo(2);
	}

	@Test
	void existsByIdReturnsTrueWhenPresent() {
		CropPlan saved = cropPlanRepository.save(buildCropPlan());

		assertThat(cropPlanRepository.existsById(saved.getPlanId())).isTrue();
	}

	@Test
	void existsByIdReturnsFalseWhenMissing() {
		assertThat(cropPlanRepository.existsById(8888)).isFalse();
	}

	@Test
	void findAllReturnsEmptyInitially() {
		assertThat(cropPlanRepository.findAll()).isEmpty();
	}

	@Test
	void findAllReturnsManyRecords() {
		CropPlan first = buildCropPlan();
		first.setYear(2024);
		CropPlan second = buildCropPlan();
		second.setYear(2025);
		CropPlan third = buildCropPlan();
		third.setYear(2026);
		cropPlanRepository.save(first);
		cropPlanRepository.save(second);
		cropPlanRepository.save(third);

		assertThat(cropPlanRepository.findAll()).hasSize(3);
	}

	@Test
	void updateAreaPlantedPersists() {
		CropPlan saved = cropPlanRepository.save(buildCropPlan());

		saved.setAreaPlanted(12.75);
		cropPlanRepository.save(saved);

		assertThat(cropPlanRepository.findById(saved.getPlanId()).orElseThrow().getAreaPlanted())
				.isEqualTo(12.75);
	}

	@Test
	void updateDatesPersist() {
		CropPlan saved = cropPlanRepository.save(buildCropPlan());

		saved.setSowingDate(LocalDate.of(2027, 2, 1));
		saved.setExpectedHarvestDate(LocalDate.of(2027, 6, 1));
		cropPlanRepository.save(saved);

		CropPlan found = cropPlanRepository.findById(saved.getPlanId()).orElseThrow();
		assertThat(found.getSowingDate()).isEqualTo(LocalDate.of(2027, 2, 1));
		assertThat(found.getExpectedHarvestDate()).isEqualTo(LocalDate.of(2027, 6, 1));
	}

	@Test
	void deleteThenGone() {
		CropPlan saved = cropPlanRepository.save(buildCropPlan());

		cropPlanRepository.deleteById(saved.getPlanId());

		assertThat(cropPlanRepository.findById(saved.getPlanId())).isEmpty();
	}

	@Test
	void persistsNullDates() {
		CropPlan plan = buildCropPlan();
		plan.setSowingDate(null);
		plan.setExpectedHarvestDate(null);

		CropPlan saved = cropPlanRepository.save(plan);

		CropPlan found = cropPlanRepository.findById(saved.getPlanId()).orElseThrow();
		assertThat(found.getSowingDate()).isNull();
		assertThat(found.getExpectedHarvestDate()).isNull();
	}

	@ParameterizedTest
	@ValueSource(strings = { "Kharif", "Rabi", "Zaid", "Perennial" })
	void persistsVariousSeasons(String season) {
		CropPlan plan = buildCropPlan();
		plan.setSeason(season);

		CropPlan saved = cropPlanRepository.save(plan);

		assertThat(cropPlanRepository.findById(saved.getPlanId()).orElseThrow().getSeason())
				.isEqualTo(season);
	}

	@ParameterizedTest
	@ValueSource(ints = { 2020, 2024, 2025, 2026, 2030 })
	void persistsBoundaryYears(int year) {
		CropPlan plan = buildCropPlan();
		plan.setYear(year);

		CropPlan saved = cropPlanRepository.save(plan);

		assertThat(cropPlanRepository.findById(saved.getPlanId()).orElseThrow().getYear())
				.isEqualTo(year);
	}

	@ParameterizedTest
	@ValueSource(doubles = { 0.1, 1.0, 5.5, 100.0, 999.99 })
	void persistsBoundaryAreas(double area) {
		CropPlan plan = buildCropPlan();
		plan.setAreaPlanted(area);

		CropPlan saved = cropPlanRepository.save(plan);

		assertThat(cropPlanRepository.findById(saved.getPlanId()).orElseThrow().getAreaPlanted())
				.isEqualTo(area);
	}

	@ParameterizedTest
	@EnumSource(PlanStatus.class)
	void persistsVariousStatuses(PlanStatus status) {
		CropPlan plan = buildCropPlan();
		plan.setStatus(status);

		CropPlan saved = cropPlanRepository.save(plan);

		assertThat(cropPlanRepository.findById(saved.getPlanId()).orElseThrow().getStatus())
				.isEqualTo(status);
	}
}


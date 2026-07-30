package com.cognizant.agrilink.crop.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.crop.enums.Stage;
import com.cognizant.agrilink.crop.entity.GrowthObservation;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class GrowthObservationRepositoryExtendedTest {

	@Autowired
	private GrowthObservationRepository growthObservationRepository;

	private GrowthObservation buildGrowthObservation() {
		return GrowthObservation.builder()
				.planId(1)
				.officerId(2)
				.observationDate(LocalDate.of(2026, 6, 15))
				.stage(Stage.FLOWERING)
				.pestOrDiseaseFlag(false)
				.remarks("Healthy crop")
				.build();
	}

	@Test
	void countReturnsNumberOfRecords() {
		growthObservationRepository.save(buildGrowthObservation());
		growthObservationRepository.save(buildGrowthObservation());

		assertThat(growthObservationRepository.count()).isEqualTo(2);
	}

	@Test
	void existsByIdReturnsTrueWhenPresent() {
		GrowthObservation saved = growthObservationRepository.save(buildGrowthObservation());

		assertThat(growthObservationRepository.existsById(saved.getObservationId())).isTrue();
	}

	@Test
	void existsByIdReturnsFalseWhenMissing() {
		assertThat(growthObservationRepository.existsById(7777)).isFalse();
	}

	@Test
	void findAllReturnsEmptyInitially() {
		assertThat(growthObservationRepository.findAll()).isEmpty();
	}

	@Test
	void findByIdReturnsEmptyWhenMissing() {
		assertThat(growthObservationRepository.findById(54321)).isEmpty();
	}

	@Test
	void findAllReturnsManyRecords() {
		growthObservationRepository.save(buildGrowthObservation());
		growthObservationRepository.save(buildGrowthObservation());
		growthObservationRepository.save(buildGrowthObservation());

		assertThat(growthObservationRepository.findAll()).hasSize(3);
	}

	@Test
	void updateStagePersists() {
		GrowthObservation saved = growthObservationRepository.save(buildGrowthObservation());

		saved.setStage(Stage.GERMINATION);
		growthObservationRepository.save(saved);

		assertThat(growthObservationRepository.findById(saved.getObservationId()).orElseThrow().getStage())
				.isEqualTo(Stage.GERMINATION);
	}

	@Test
	void updatePestFlagPersists() {
		GrowthObservation saved = growthObservationRepository.save(buildGrowthObservation());

		saved.setPestOrDiseaseFlag(true);
		growthObservationRepository.save(saved);

		assertThat(growthObservationRepository.findById(saved.getObservationId()).orElseThrow().getPestOrDiseaseFlag())
				.isTrue();
	}

	@Test
	void updateRemarksPersists() {
		GrowthObservation saved = growthObservationRepository.save(buildGrowthObservation());

		saved.setRemarks("Pest detected");
		growthObservationRepository.save(saved);

		assertThat(growthObservationRepository.findById(saved.getObservationId()).orElseThrow().getRemarks())
				.isEqualTo("Pest detected");
	}

	@Test
	void deleteThenGone() {
		GrowthObservation saved = growthObservationRepository.save(buildGrowthObservation());

		growthObservationRepository.delete(saved);

		assertThat(growthObservationRepository.existsById(saved.getObservationId())).isFalse();
	}

	@Test
	void persistsNullableFields() {
		GrowthObservation observation = GrowthObservation.builder()
				.planId(1)
				.officerId(2)
				.observationDate(null)
				.stage(null)
				.pestOrDiseaseFlag(null)
				.remarks(null)
				.build();

		GrowthObservation saved = growthObservationRepository.save(observation);

		assertThat(growthObservationRepository.findById(saved.getObservationId())).isPresent();
	}

	@ParameterizedTest
	@ValueSource(booleans = { true, false })
	void persistsBothPestFlagValues(boolean flag) {
		GrowthObservation observation = buildGrowthObservation();
		observation.setPestOrDiseaseFlag(flag);

		GrowthObservation saved = growthObservationRepository.save(observation);

		assertThat(growthObservationRepository.findById(saved.getObservationId()).orElseThrow().getPestOrDiseaseFlag())
				.isEqualTo(flag);
	}

	@ParameterizedTest
	@EnumSource(Stage.class)
	void persistsVariousStages(Stage stage) {
		GrowthObservation observation = buildGrowthObservation();
		observation.setStage(stage);

		GrowthObservation saved = growthObservationRepository.save(observation);

		assertThat(growthObservationRepository.findById(saved.getObservationId()).orElseThrow().getStage())
				.isEqualTo(stage);
	}

	@ParameterizedTest
	@ValueSource(strings = { "2025-01-01", "2026-06-15", "2026-12-31", "2027-03-20" })
	void persistsVariousObservationDates(String date) {
		GrowthObservation observation = buildGrowthObservation();
		observation.setObservationDate(LocalDate.parse(date));

		GrowthObservation saved = growthObservationRepository.save(observation);

		assertThat(growthObservationRepository.findById(saved.getObservationId()).orElseThrow().getObservationDate())
				.isEqualTo(LocalDate.parse(date));
	}
}


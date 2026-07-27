package com.cognizant.agrilink.crop.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.crop.enums.Stage;
import com.cognizant.agrilink.crop.entity.GrowthObservation;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class GrowthObservationRepositoryTest {

	@Autowired
	private GrowthObservationRepository growthObservationRepository;

	private GrowthObservation buildGrowthObservation() {
		return GrowthObservation.builder()
				.planId(1)
				.officerId(2)
				.observationDate(LocalDate.of(2026, 6, 15))
				.stage(Stage.GR)
				.pestOrDiseaseFlag(false)
				.remarks("Healthy crop")
				.build();
	}

	@Test
	void saveAndFindById() {
		GrowthObservation saved = growthObservationRepository.save(buildGrowthObservation());

		GrowthObservation found = growthObservationRepository.findById(saved.getObservationId()).orElseThrow();

		assertThat(found.getStage()).isEqualTo(Stage.GR);
		assertThat(found.getRemarks()).isEqualTo("Healthy crop");
	}

	@Test
	void findAllReturnsSavedRecords() {
		growthObservationRepository.save(buildGrowthObservation());
		growthObservationRepository.save(buildGrowthObservation());

		assertThat(growthObservationRepository.findAll()).hasSize(2);
	}

	@Test
	void deleteRemovesRecord() {
		GrowthObservation saved = growthObservationRepository.save(buildGrowthObservation());

		growthObservationRepository.deleteById(saved.getObservationId());

		assertThat(growthObservationRepository.findById(saved.getObservationId())).isEmpty();
	}
}

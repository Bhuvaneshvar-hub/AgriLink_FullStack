package com.cognizant.agrilink.crop.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.crop.enums.PlanStatus;
import com.cognizant.agrilink.crop.entity.CropPlan;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class CropPlanRepositoryTest {

	@Autowired
	private CropPlanRepository cropPlanRepository;

	private CropPlan buildCropPlan() {
		return CropPlan.builder()
				.farmerId(1)
				.holdingId(2)
				.cropId(3)
				.season("Rabi")
				.year(2026)
				.sowingDate(LocalDate.of(2026, 6, 15))
				.expectedHarvestDate(LocalDate.of(2026, 10, 15))
				.areaPlanted(5.5)
				.status(PlanStatus.PLANNED)
				.build();
	}

	@Test
	void saveAndFindById() {
		CropPlan saved = cropPlanRepository.save(buildCropPlan());

		CropPlan found = cropPlanRepository.findById(saved.getPlanId()).orElseThrow();

		assertThat(found.getSeason()).isEqualTo("Rabi");
		assertThat(found.getStatus()).isEqualTo(PlanStatus.PLANNED);
	}

	@Test
	void findAllReturnsSavedRecords() {
		CropPlan first = buildCropPlan();
		first.setYear(2025);
		CropPlan second = buildCropPlan();
		second.setYear(2026);
		cropPlanRepository.save(first);
		cropPlanRepository.save(second);

		assertThat(cropPlanRepository.findAll()).hasSize(2);
	}

	@Test
	void deleteRemovesRecord() {
		CropPlan saved = cropPlanRepository.save(buildCropPlan());

		cropPlanRepository.deleteById(saved.getPlanId());

		assertThat(cropPlanRepository.findById(saved.getPlanId())).isEmpty();
	}
}


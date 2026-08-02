package com.cognizant.agrilink.farmer.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.farmer.entity.CropHistory;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class CropHistoryRepositoryTest {

	@Autowired
	private CropHistoryRepository cropHistoryRepository;

	private CropHistory buildCropHistory() {
		return CropHistory.builder()
				.holdingId(1)
				.farmerId(1)
				.cropName("Paddy")
				.season("Kharif")
				.cropYear(2024)
				.areaAcres(4.2)
				.yieldQuintals(92.5)
				.remarks("Good monsoon")
				.build();
	}

	@Test
	void saveAndFindById() {
		CropHistory saved = cropHistoryRepository.save(buildCropHistory());

		CropHistory found = cropHistoryRepository.findById(saved.getHistoryId()).orElseThrow();

		assertThat(found.getCropName()).isEqualTo("Paddy");
		assertThat(found.getSeason()).isEqualTo("Kharif");
	}

	@Test
	void findByFarmerIdInReturnsMatches() {
		cropHistoryRepository.save(buildCropHistory());
		CropHistory other = buildCropHistory();
		other.setFarmerId(2);
		other.setCropName("Cotton");
		cropHistoryRepository.save(other);

		assertThat(cropHistoryRepository.findByFarmerIdIn(List.of(1))).hasSize(1);
		assertThat(cropHistoryRepository.findByFarmerIdIn(List.of(1, 2))).hasSize(2);
	}

	@Test
	void findByHoldingIdReturnsMatches() {
		cropHistoryRepository.save(buildCropHistory());
		CropHistory other = buildCropHistory();
		other.setHoldingId(9);
		cropHistoryRepository.save(other);

		assertThat(cropHistoryRepository.findByHoldingId(1)).hasSize(1);
		assertThat(cropHistoryRepository.findByHoldingId(9)).hasSize(1);
	}

	@Test
	void deleteRemovesRecord() {
		CropHistory saved = cropHistoryRepository.save(buildCropHistory());

		cropHistoryRepository.deleteById(saved.getHistoryId());

		assertThat(cropHistoryRepository.findById(saved.getHistoryId())).isEmpty();
	}
}

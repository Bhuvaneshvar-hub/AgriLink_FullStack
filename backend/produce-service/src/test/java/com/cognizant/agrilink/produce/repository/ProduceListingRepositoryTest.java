package com.cognizant.agrilink.produce.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.produce.entity.ProduceListing;
import com.cognizant.agrilink.produce.enums.ListingStatus;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class ProduceListingRepositoryTest {

	@Autowired
	private ProduceListingRepository produceListingRepository;

	private ProduceListing buildProduceListing() {
		return ProduceListing.builder()
				.farmerId(1)
				.cropId(1)
				.harvestDate(LocalDate.of(2026, 6, 15))
				.quantityKg(500.0)
				.qualityGrade("A")
				.askingPricePerKg(25.5)
				.status(ListingStatus.AV)
				.build();
	}

	@Test
	void saveAndFindById() {
		ProduceListing saved = produceListingRepository.save(buildProduceListing());

		ProduceListing found = produceListingRepository.findById(saved.getListingId()).orElseThrow();

		assertThat(found.getQualityGrade()).isEqualTo("A");
		assertThat(found.getStatus()).isEqualTo(ListingStatus.AV);
	}

	@Test
	void findAllReturnsSavedRecords() {
		produceListingRepository.save(buildProduceListing());
		produceListingRepository.save(buildProduceListing());

		assertThat(produceListingRepository.findAll()).hasSize(2);
	}

	@Test
	void deleteRemovesRecord() {
		ProduceListing saved = produceListingRepository.save(buildProduceListing());

		produceListingRepository.deleteById(saved.getListingId());

		assertThat(produceListingRepository.findById(saved.getListingId())).isEmpty();
	}
}

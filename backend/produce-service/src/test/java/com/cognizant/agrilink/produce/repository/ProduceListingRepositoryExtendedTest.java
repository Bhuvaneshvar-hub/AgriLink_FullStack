package com.cognizant.agrilink.produce.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.produce.entity.ProduceListing;
import com.cognizant.agrilink.produce.enums.ListingStatus;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class ProduceListingRepositoryExtendedTest {

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

	@ParameterizedTest
	@EnumSource(ListingStatus.class)
	void savePersistsEachStatus(ListingStatus status) {
		ProduceListing listing = buildProduceListing();
		listing.setStatus(status);

		ProduceListing saved = produceListingRepository.save(listing);

		assertThat(produceListingRepository.findById(saved.getListingId()).orElseThrow().getStatus())
				.isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(strings = {"A", "B", "C"})
	void savePersistsEachQualityGrade(String grade) {
		ProduceListing listing = buildProduceListing();
		listing.setQualityGrade(grade);

		ProduceListing saved = produceListingRepository.save(listing);

		assertThat(produceListingRepository.findById(saved.getListingId()).orElseThrow().getQualityGrade())
				.isEqualTo(grade);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.5, 1.0, 999.99, 100000.0})
	void savePersistsBoundaryQuantities(double quantity) {
		ProduceListing listing = buildProduceListing();
		listing.setQuantityKg(quantity);

		ProduceListing saved = produceListingRepository.save(listing);

		assertThat(produceListingRepository.findById(saved.getListingId()).orElseThrow().getQuantityKg())
				.isEqualTo(quantity);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.01, 25.5, 9999.99})
	void savePersistsBoundaryPrices(double price) {
		ProduceListing listing = buildProduceListing();
		listing.setAskingPricePerKg(price);

		ProduceListing saved = produceListingRepository.save(listing);

		assertThat(produceListingRepository.findById(saved.getListingId()).orElseThrow().getAskingPricePerKg())
				.isEqualTo(price);
	}

	@ParameterizedTest
	@CsvSource({"1,1", "2,5", "999,1000", "50,42"})
	void savePersistsVariousIds(int farmerId, int cropId) {
		ProduceListing listing = buildProduceListing();
		listing.setFarmerId(farmerId);
		listing.setCropId(cropId);

		ProduceListing saved = produceListingRepository.save(listing);

		ProduceListing found = produceListingRepository.findById(saved.getListingId()).orElseThrow();
		assertThat(found.getFarmerId()).isEqualTo(farmerId);
		assertThat(found.getCropId()).isEqualTo(cropId);
	}

	@ParameterizedTest
	@CsvSource({"2026-01-01", "2025-12-31", "2026-06-15", "2024-02-29"})
	void savePersistsVariousHarvestDates(String date) {
		ProduceListing listing = buildProduceListing();
		listing.setHarvestDate(LocalDate.parse(date));

		ProduceListing saved = produceListingRepository.save(listing);

		assertThat(produceListingRepository.findById(saved.getListingId()).orElseThrow().getHarvestDate())
				.isEqualTo(LocalDate.parse(date));
	}

	@ParameterizedTest
	@NullAndEmptySource
	@ValueSource(strings = {"   "})
	void savePersistsBlankOrNullQualityGrade(String grade) {
		ProduceListing listing = buildProduceListing();
		listing.setQualityGrade(grade);

		ProduceListing saved = produceListingRepository.save(listing);

		assertThat(produceListingRepository.findById(saved.getListingId()).orElseThrow().getQualityGrade())
				.isEqualTo(grade);
	}

	@ParameterizedTest
	@NullSource
	void savePersistsNullStatus(ListingStatus status) {
		ProduceListing listing = buildProduceListing();
		listing.setStatus(status);

		ProduceListing saved = produceListingRepository.save(listing);

		assertThat(produceListingRepository.findById(saved.getListingId()).orElseThrow().getStatus())
				.isNull();
	}

	@Test
	void countReturnsNumberOfRecords() {
		produceListingRepository.save(buildProduceListing());
		produceListingRepository.save(buildProduceListing());
		produceListingRepository.save(buildProduceListing());

		assertThat(produceListingRepository.count()).isEqualTo(3);
	}

	@Test
	void existsByIdReturnsTrueWhenPresent() {
		ProduceListing saved = produceListingRepository.save(buildProduceListing());

		assertThat(produceListingRepository.existsById(saved.getListingId())).isTrue();
	}

	@Test
	void existsByIdReturnsFalseWhenMissing() {
		assertThat(produceListingRepository.existsById(9999)).isFalse();
	}

	@Test
	void findAllReturnsEmptyWhenNoRecords() {
		assertThat(produceListingRepository.findAll()).isEmpty();
	}

	@Test
	void findAllReturnsManyRecords() {
		for (int i = 0; i < 5; i++) {
			produceListingRepository.save(buildProduceListing());
		}

		assertThat(produceListingRepository.findAll()).hasSize(5);
	}

	@Test
	void findByIdReturnsEmptyWhenMissing() {
		assertThat(produceListingRepository.findById(12345)).isEmpty();
	}

	@Test
	void updateChangesPersistedFields() {
		ProduceListing saved = produceListingRepository.save(buildProduceListing());

		saved.setStatus(ListingStatus.SO);
		saved.setQuantityKg(123.4);
		produceListingRepository.save(saved);

		ProduceListing found = produceListingRepository.findById(saved.getListingId()).orElseThrow();
		assertThat(found.getStatus()).isEqualTo(ListingStatus.SO);
		assertThat(found.getQuantityKg()).isEqualTo(123.4);
	}

	@Test
	void deleteThenGone() {
		ProduceListing saved = produceListingRepository.save(buildProduceListing());

		produceListingRepository.delete(saved);

		assertThat(produceListingRepository.findById(saved.getListingId())).isEmpty();
	}

	@Test
	void deleteAllRemovesEverything() {
		produceListingRepository.save(buildProduceListing());
		produceListingRepository.save(buildProduceListing());

		produceListingRepository.deleteAll();

		assertThat(produceListingRepository.count()).isZero();
	}
}

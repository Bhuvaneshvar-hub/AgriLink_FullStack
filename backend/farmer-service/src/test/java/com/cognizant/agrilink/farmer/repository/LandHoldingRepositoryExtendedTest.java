package com.cognizant.agrilink.farmer.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.farmer.entity.LandHolding;
import com.cognizant.agrilink.farmer.enums.Status;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class LandHoldingRepositoryExtendedTest {

	@Autowired
	private LandHoldingRepository landHoldingRepository;

	private LandHolding buildLandHolding() {
		return LandHolding.builder()
				.farmerId(1)
				.surveyNumber("SY-101/2A")
				.areaAcres(5.5)
				.soilType("Black")
				.irrigationSource("Borewell")
				.ownershipType("Owned")
				.status(Status.AC)
				.build();
	}

	private LandHolding buildLandHolding(String surveyNumber) {
		LandHolding holding = buildLandHolding();
		holding.setSurveyNumber(surveyNumber);
		return holding;
	}

	@Test
	void saveAssignsGeneratedId() {
		LandHolding saved = landHoldingRepository.save(buildLandHolding());

		assertThat(saved.getHoldingId()).isNotNull();
	}

	@Test
	void findAllEmptyInitially() {
		assertThat(landHoldingRepository.findAll()).isEmpty();
	}

	@Test
	void countReturnsZeroInitially() {
		assertThat(landHoldingRepository.count()).isZero();
	}

	@Test
	void countReflectsSavedRecords() {
		landHoldingRepository.save(buildLandHolding("SY-101/2A"));
		landHoldingRepository.save(buildLandHolding("SY-101/2B"));
		landHoldingRepository.save(buildLandHolding("SY-101/2C"));

		assertThat(landHoldingRepository.count()).isEqualTo(3);
	}

	@Test
	void existsByIdReturnsTrueWhenPresent() {
		LandHolding saved = landHoldingRepository.save(buildLandHolding());

		assertThat(landHoldingRepository.existsById(saved.getHoldingId())).isTrue();
	}

	@Test
	void existsByIdReturnsFalseWhenAbsent() {
		assertThat(landHoldingRepository.existsById(9999)).isFalse();
	}

	@Test
	void findByIdEmptyWhenAbsent() {
		assertThat(landHoldingRepository.findById(9999)).isEmpty();
	}

	@Test
	void saveAndFindById() {
		LandHolding saved = landHoldingRepository.save(buildLandHolding());

		LandHolding found = landHoldingRepository.findById(saved.getHoldingId()).orElseThrow();
		assertThat(found.getSurveyNumber()).isEqualTo("SY-101/2A");
		assertThat(found.getSoilType()).isEqualTo("Black");
	}

	@Test
	void saveManyAndFindAll() {
		for (int i = 0; i < 5; i++) {
			landHoldingRepository.save(buildLandHolding("SY-101/" + i));
		}

		assertThat(landHoldingRepository.findAll()).hasSize(5);
	}

	@Test
	void deleteThenVerifyGone() {
		LandHolding saved = landHoldingRepository.save(buildLandHolding());

		landHoldingRepository.delete(saved);

		assertThat(landHoldingRepository.findById(saved.getHoldingId())).isEmpty();
	}

	@Test
	void deleteByIdRemovesRecord() {
		LandHolding saved = landHoldingRepository.save(buildLandHolding());

		landHoldingRepository.deleteById(saved.getHoldingId());

		assertThat(landHoldingRepository.findById(saved.getHoldingId())).isEmpty();
	}

	@Test
	void deleteAllRemovesEverything() {
		landHoldingRepository.save(buildLandHolding("SY-101/2A"));
		landHoldingRepository.save(buildLandHolding("SY-101/2B"));

		landHoldingRepository.deleteAll();

		assertThat(landHoldingRepository.findAll()).isEmpty();
	}

	@Test
	void updateAreaPersists() {
		LandHolding saved = landHoldingRepository.save(buildLandHolding());

		saved.setAreaAcres(12.75);
		landHoldingRepository.save(saved);

		assertThat(landHoldingRepository.findById(saved.getHoldingId()).orElseThrow().getAreaAcres())
				.isEqualTo(12.75);
	}

	@Test
	void updateSoilTypePersists() {
		LandHolding saved = landHoldingRepository.save(buildLandHolding());

		saved.setSoilType("Red");
		landHoldingRepository.save(saved);

		assertThat(landHoldingRepository.findById(saved.getHoldingId()).orElseThrow().getSoilType())
				.isEqualTo("Red");
	}

	@Test
	void savedRecordRetainsAllFields() {
		LandHolding saved = landHoldingRepository.save(buildLandHolding());

		LandHolding found = landHoldingRepository.findById(saved.getHoldingId()).orElseThrow();
		assertThat(found.getFarmerId()).isEqualTo(1);
		assertThat(found.getAreaAcres()).isEqualTo(5.5);
		assertThat(found.getIrrigationSource()).isEqualTo("Borewell");
		assertThat(found.getOwnershipType()).isEqualTo("Owned");
		assertThat(found.getStatus()).isEqualTo(Status.AC);
	}

	@ParameterizedTest
	@ValueSource(strings = {"Black", "Red", "Alluvial", "Laterite", "Clay", "Sandy", "Loamy"})
	void saveWithVariousSoilTypes(String soilType) {
		LandHolding holding = buildLandHolding();
		holding.setSoilType(soilType);

		LandHolding saved = landHoldingRepository.save(holding);

		assertThat(landHoldingRepository.findById(saved.getHoldingId()).orElseThrow().getSoilType())
				.isEqualTo(soilType);
	}

	@ParameterizedTest
	@ValueSource(strings = {"Borewell", "Canal", "Rainfed", "Well", "Tank", "River"})
	void saveWithVariousIrrigationSources(String irrigation) {
		LandHolding holding = buildLandHolding();
		holding.setIrrigationSource(irrigation);

		LandHolding saved = landHoldingRepository.save(holding);

		assertThat(landHoldingRepository.findById(saved.getHoldingId()).orElseThrow().getIrrigationSource())
				.isEqualTo(irrigation);
	}

	@ParameterizedTest
	@ValueSource(strings = {"Owned", "Leased", "Rented", "Shared", "Inherited"})
	void saveWithVariousOwnershipTypes(String ownership) {
		LandHolding holding = buildLandHolding();
		holding.setOwnershipType(ownership);

		LandHolding saved = landHoldingRepository.save(holding);

		assertThat(landHoldingRepository.findById(saved.getHoldingId()).orElseThrow().getOwnershipType())
				.isEqualTo(ownership);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, -1.0, 0.5, 100.0, 9999.99, 1000000.0})
	void saveWithBoundaryAreaAcres(double area) {
		LandHolding holding = buildLandHolding();
		holding.setAreaAcres(area);

		LandHolding saved = landHoldingRepository.save(holding);

		assertThat(landHoldingRepository.findById(saved.getHoldingId()).orElseThrow().getAreaAcres())
				.isEqualTo(area);
	}

	@ParameterizedTest
	@NullAndEmptySource
	@ValueSource(strings = {"   "})
	void saveWithBlankOrNullSurveyNumber(String surveyNumber) {
		LandHolding holding = buildLandHolding();
		holding.setSurveyNumber(surveyNumber);

		LandHolding saved = landHoldingRepository.save(holding);

		assertThat(landHoldingRepository.findById(saved.getHoldingId()).orElseThrow().getSurveyNumber())
				.isEqualTo(surveyNumber);
	}

	@ParameterizedTest
	@CsvSource({
			"1, SY-1, 2.0",
			"2, SY-2, 4.5",
			"3, SY-3, 10.0",
			"4, SY-4, 0.25",
			"5, SY-5, 50.5"
	})
	void saveWithVariousFarmerData(Integer farmerId, String surveyNumber, Double area) {
		LandHolding holding = buildLandHolding();
		holding.setFarmerId(farmerId);
		holding.setSurveyNumber(surveyNumber);
		holding.setAreaAcres(area);

		LandHolding saved = landHoldingRepository.save(holding);

		LandHolding found = landHoldingRepository.findById(saved.getHoldingId()).orElseThrow();
		assertThat(found.getFarmerId()).isEqualTo(farmerId);
		assertThat(found.getSurveyNumber()).isEqualTo(surveyNumber);
		assertThat(found.getAreaAcres()).isEqualTo(area);
	}

	@Test
	void saveAllPersistsMultiple() {
		landHoldingRepository.saveAll(List.of(buildLandHolding("SY-101/2A"), buildLandHolding("SY-101/2B")));

		assertThat(landHoldingRepository.count()).isEqualTo(2);
	}
}

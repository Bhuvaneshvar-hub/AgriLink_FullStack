package com.cognizant.agrilink.subsidy.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.subsidy.entity.SubsidyApplication;
import com.cognizant.agrilink.subsidy.enums.ApplicationStatus;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class SubsidyApplicationRepositoryExtendedTest {

	@Autowired
	private SubsidyApplicationRepository subsidyApplicationRepository;

	private SubsidyApplication buildSubsidyApplication() {
		return buildSubsidyApplication(1, 1);
	}

	private SubsidyApplication buildSubsidyApplication(int farmerId, int schemeId) {
		return SubsidyApplication.builder()
				.farmerId(farmerId)
				.schemeId(schemeId)
				.applicationDate(LocalDate.of(2026, 2, 1))
				.eligibilityScore(85.5)
				.reviewedBy(2)
				.disbursedAmount(6000.0)
				.disbursedDate(LocalDate.of(2026, 3, 1))
				.status(ApplicationStatus.AP)
				.build();
	}

	@ParameterizedTest
	@EnumSource(ApplicationStatus.class)
	void saveWithVariousStatuses(ApplicationStatus status) {
		SubsidyApplication application = buildSubsidyApplication();
		application.setStatus(status);

		SubsidyApplication saved = subsidyApplicationRepository.save(application);

		assertThat(subsidyApplicationRepository.findById(saved.getApplicationId()).orElseThrow().getStatus())
				.isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.5, 50.0, 99.99, 100.0})
	void saveWithBoundaryEligibilityScores(double score) {
		SubsidyApplication application = buildSubsidyApplication();
		application.setEligibilityScore(score);

		SubsidyApplication saved = subsidyApplicationRepository.save(application);

		assertThat(subsidyApplicationRepository.findById(saved.getApplicationId()).orElseThrow().getEligibilityScore())
				.isEqualTo(score);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 100, 9999, 2147483647})
	void saveWithVariousFarmerIds(int farmerId) {
		SubsidyApplication application = buildSubsidyApplication();
		application.setFarmerId(farmerId);

		SubsidyApplication saved = subsidyApplicationRepository.save(application);

		assertThat(subsidyApplicationRepository.findById(saved.getApplicationId()).orElseThrow().getFarmerId())
				.isEqualTo(farmerId);
	}

	@ParameterizedTest
	@CsvSource({
		"1,2,PE",
		"5,10,PE",
		"99,3,DB"
	})
	void saveWithVariousIdsAndStatus(int farmerId, int reviewedBy, ApplicationStatus status) {
		SubsidyApplication application = buildSubsidyApplication();
		application.setFarmerId(farmerId);
		application.setReviewedBy(reviewedBy);
		application.setStatus(status);

		SubsidyApplication saved = subsidyApplicationRepository.save(application);

		SubsidyApplication found = subsidyApplicationRepository.findById(saved.getApplicationId()).orElseThrow();
		assertThat(found.getFarmerId()).isEqualTo(farmerId);
		assertThat(found.getReviewedBy()).isEqualTo(reviewedBy);
		assertThat(found.getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 1500.0, 6000.0, 250000.0})
	void saveWithVariousDisbursedAmounts(double amount) {
		SubsidyApplication application = buildSubsidyApplication();
		application.setDisbursedAmount(amount);

		SubsidyApplication saved = subsidyApplicationRepository.save(application);

		assertThat(subsidyApplicationRepository.findById(saved.getApplicationId()).orElseThrow().getDisbursedAmount())
				.isEqualTo(amount);
	}

	@Test
	void saveAndFindByIdReturnsAllFields() {
		SubsidyApplication saved = subsidyApplicationRepository.save(buildSubsidyApplication());

		SubsidyApplication found = subsidyApplicationRepository.findById(saved.getApplicationId()).orElseThrow();

		assertThat(found.getFarmerId()).isEqualTo(1);
		assertThat(found.getSchemeId()).isEqualTo(1);
		assertThat(found.getApplicationDate()).isEqualTo(LocalDate.of(2026, 2, 1));
		assertThat(found.getEligibilityScore()).isEqualTo(85.5);
		assertThat(found.getReviewedBy()).isEqualTo(2);
		assertThat(found.getDisbursedAmount()).isEqualTo(6000.0);
		assertThat(found.getDisbursedDate()).isEqualTo(LocalDate.of(2026, 3, 1));
		assertThat(found.getStatus()).isEqualTo(ApplicationStatus.AP);
	}

	@Test
	void saveWithNullDisbursedFields() {
		SubsidyApplication application = buildSubsidyApplication();
		application.setDisbursedAmount(null);
		application.setDisbursedDate(null);

		SubsidyApplication saved = subsidyApplicationRepository.save(application);

		SubsidyApplication found = subsidyApplicationRepository.findById(saved.getApplicationId()).orElseThrow();
		assertThat(found.getDisbursedAmount()).isNull();
		assertThat(found.getDisbursedDate()).isNull();
	}

	@Test
	void findByIdMissingReturnsEmpty() {
		assertThat(subsidyApplicationRepository.findById(9999)).isEmpty();
	}

	@Test
	void findAllEmptyReturnsEmptyList() {
		assertThat(subsidyApplicationRepository.findAll()).isEmpty();
	}

	@Test
	void findAllManyReturnsAll() {
		subsidyApplicationRepository.save(buildSubsidyApplication(1, 1));
		subsidyApplicationRepository.save(buildSubsidyApplication(1, 2));
		subsidyApplicationRepository.save(buildSubsidyApplication(1, 3));

		assertThat(subsidyApplicationRepository.findAll()).hasSize(3);
	}

	@Test
	void countReturnsNumberOfRecords() {
		subsidyApplicationRepository.save(buildSubsidyApplication(1, 1));
		subsidyApplicationRepository.save(buildSubsidyApplication(1, 2));

		assertThat(subsidyApplicationRepository.count()).isEqualTo(2);
	}

	@Test
	void countIsZeroWhenEmpty() {
		assertThat(subsidyApplicationRepository.count()).isZero();
	}

	@Test
	void existsByIdTrueWhenPresent() {
		SubsidyApplication saved = subsidyApplicationRepository.save(buildSubsidyApplication());

		assertThat(subsidyApplicationRepository.existsById(saved.getApplicationId())).isTrue();
	}

	@Test
	void existsByIdFalseWhenMissing() {
		assertThat(subsidyApplicationRepository.existsById(9999)).isFalse();
	}

	@Test
	void updateChangesPersistedFields() {
		SubsidyApplication saved = subsidyApplicationRepository.save(buildSubsidyApplication());

		saved.setStatus(ApplicationStatus.DB);
		saved.setDisbursedAmount(9000.0);
		subsidyApplicationRepository.save(saved);

		SubsidyApplication found = subsidyApplicationRepository.findById(saved.getApplicationId()).orElseThrow();
		assertThat(found.getStatus()).isEqualTo(ApplicationStatus.DB);
		assertThat(found.getDisbursedAmount()).isEqualTo(9000.0);
	}

	@Test
	void deleteThenGone() {
		SubsidyApplication saved = subsidyApplicationRepository.save(buildSubsidyApplication());

		subsidyApplicationRepository.delete(saved);

		assertThat(subsidyApplicationRepository.findById(saved.getApplicationId())).isEmpty();
	}

	@Test
	void deleteAllRemovesEverything() {
		subsidyApplicationRepository.save(buildSubsidyApplication(1, 1));
		subsidyApplicationRepository.save(buildSubsidyApplication(1, 2));

		subsidyApplicationRepository.deleteAll();

		assertThat(subsidyApplicationRepository.findAll()).isEmpty();
	}

	@Test
	void saveAllPersistsMultiple() {
		List<SubsidyApplication> applications = List.of(buildSubsidyApplication(1, 1), buildSubsidyApplication(1, 2));

		subsidyApplicationRepository.saveAll(applications);

		assertThat(subsidyApplicationRepository.count()).isEqualTo(2);
	}

	@Test
	void generatedIdIsAssigned() {
		SubsidyApplication saved = subsidyApplicationRepository.save(buildSubsidyApplication());

		assertThat(saved.getApplicationId()).isNotNull();
	}
}

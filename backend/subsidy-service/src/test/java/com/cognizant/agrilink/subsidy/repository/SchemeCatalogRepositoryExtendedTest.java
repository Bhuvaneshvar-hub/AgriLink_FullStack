package com.cognizant.agrilink.subsidy.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.subsidy.entity.SchemeCatalog;
import com.cognizant.agrilink.subsidy.enums.Status;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class SchemeCatalogRepositoryExtendedTest {

	@Autowired
	private SchemeCatalogRepository schemeCatalogRepository;

	private SchemeCatalog buildSchemeCatalog() {
		return buildSchemeCatalog("PM Kisan");
	}

	private SchemeCatalog buildSchemeCatalog(String schemeName) {
		return SchemeCatalog.builder()
				.schemeName(schemeName)
				.category("InputSubsidy")
				.eligibilityCriteria("Small and marginal farmers")
				.benefitAmount(6000.0)
				.fundingSource("Central")
				.startDate(LocalDate.of(2026, 1, 1))
				.endDate(LocalDate.of(2026, 12, 31))
				.status(Status.AC)
				.build();
	}

	@ParameterizedTest
	@EnumSource(Status.class)
	void saveWithVariousStatuses(Status status) {
		SchemeCatalog scheme = buildSchemeCatalog();
		scheme.setStatus(status);

		SchemeCatalog saved = schemeCatalogRepository.save(scheme);

		assertThat(schemeCatalogRepository.findById(saved.getSchemeId()).orElseThrow().getStatus())
				.isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(strings = {"InputSubsidy", "CropInsurance", "EquipmentGrant", "WelfareSupport"})
	void saveWithVariousCategories(String category) {
		SchemeCatalog scheme = buildSchemeCatalog();
		scheme.setCategory(category);

		SchemeCatalog saved = schemeCatalogRepository.save(scheme);

		assertThat(schemeCatalogRepository.findById(saved.getSchemeId()).orElseThrow().getCategory())
				.isEqualTo(category);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.01, 1000.0, 99999.99, 1000000.0})
	void saveWithBoundaryBenefitAmounts(double amount) {
		SchemeCatalog scheme = buildSchemeCatalog();
		scheme.setBenefitAmount(amount);

		SchemeCatalog saved = schemeCatalogRepository.save(scheme);

		assertThat(schemeCatalogRepository.findById(saved.getSchemeId()).orElseThrow().getBenefitAmount())
				.isEqualTo(amount);
	}

	@ParameterizedTest
	@NullAndEmptySource
	void saveWithBlankOrNullSchemeName(String schemeName) {
		SchemeCatalog scheme = buildSchemeCatalog();
		scheme.setSchemeName(schemeName);

		SchemeCatalog saved = schemeCatalogRepository.save(scheme);

		assertThat(schemeCatalogRepository.findById(saved.getSchemeId()).orElseThrow().getSchemeName())
				.isEqualTo(schemeName);
	}

	@ParameterizedTest
	@CsvSource({
		"PM Kisan,Central",
		"Crop Insurance Scheme,State",
		"Equipment Grant,Mixed"
	})
	void saveWithVariousNameAndFundingSource(String name, String fundingSource) {
		SchemeCatalog scheme = buildSchemeCatalog();
		scheme.setSchemeName(name);
		scheme.setFundingSource(fundingSource);

		SchemeCatalog saved = schemeCatalogRepository.save(scheme);

		SchemeCatalog found = schemeCatalogRepository.findById(saved.getSchemeId()).orElseThrow();
		assertThat(found.getSchemeName()).isEqualTo(name);
		assertThat(found.getFundingSource()).isEqualTo(fundingSource);
	}

	@Test
	void saveAndFindByIdReturnsAllFields() {
		SchemeCatalog saved = schemeCatalogRepository.save(buildSchemeCatalog());

		SchemeCatalog found = schemeCatalogRepository.findById(saved.getSchemeId()).orElseThrow();

		assertThat(found.getSchemeName()).isEqualTo("PM Kisan");
		assertThat(found.getCategory()).isEqualTo("InputSubsidy");
		assertThat(found.getEligibilityCriteria()).isEqualTo("Small and marginal farmers");
		assertThat(found.getBenefitAmount()).isEqualTo(6000.0);
		assertThat(found.getFundingSource()).isEqualTo("Central");
		assertThat(found.getStartDate()).isEqualTo(LocalDate.of(2026, 1, 1));
		assertThat(found.getEndDate()).isEqualTo(LocalDate.of(2026, 12, 31));
		assertThat(found.getStatus()).isEqualTo(Status.AC);
	}

	@Test
	void findByIdMissingReturnsEmpty() {
		assertThat(schemeCatalogRepository.findById(9999)).isEmpty();
	}

	@Test
	void findAllEmptyReturnsEmptyList() {
		assertThat(schemeCatalogRepository.findAll()).isEmpty();
	}

	@Test
	void findAllManyReturnsAll() {
		schemeCatalogRepository.save(buildSchemeCatalog("PM Kisan"));
		schemeCatalogRepository.save(buildSchemeCatalog("Crop Insurance"));
		schemeCatalogRepository.save(buildSchemeCatalog("Equipment Grant"));

		assertThat(schemeCatalogRepository.findAll()).hasSize(3);
	}

	@Test
	void countReturnsNumberOfRecords() {
		schemeCatalogRepository.save(buildSchemeCatalog("PM Kisan"));
		schemeCatalogRepository.save(buildSchemeCatalog("Crop Insurance"));

		assertThat(schemeCatalogRepository.count()).isEqualTo(2);
	}

	@Test
	void countIsZeroWhenEmpty() {
		assertThat(schemeCatalogRepository.count()).isZero();
	}

	@Test
	void existsByIdTrueWhenPresent() {
		SchemeCatalog saved = schemeCatalogRepository.save(buildSchemeCatalog());

		assertThat(schemeCatalogRepository.existsById(saved.getSchemeId())).isTrue();
	}

	@Test
	void existsByIdFalseWhenMissing() {
		assertThat(schemeCatalogRepository.existsById(9999)).isFalse();
	}

	@Test
	void updateChangesPersistedFields() {
		SchemeCatalog saved = schemeCatalogRepository.save(buildSchemeCatalog());

		saved.setStatus(Status.IN);
		saved.setBenefitAmount(7500.0);
		schemeCatalogRepository.save(saved);

		SchemeCatalog found = schemeCatalogRepository.findById(saved.getSchemeId()).orElseThrow();
		assertThat(found.getStatus()).isEqualTo(Status.IN);
		assertThat(found.getBenefitAmount()).isEqualTo(7500.0);
	}

	@Test
	void deleteThenGone() {
		SchemeCatalog saved = schemeCatalogRepository.save(buildSchemeCatalog());

		schemeCatalogRepository.delete(saved);

		assertThat(schemeCatalogRepository.findById(saved.getSchemeId())).isEmpty();
	}

	@Test
	void deleteAllRemovesEverything() {
		schemeCatalogRepository.save(buildSchemeCatalog("PM Kisan"));
		schemeCatalogRepository.save(buildSchemeCatalog("Crop Insurance"));

		schemeCatalogRepository.deleteAll();

		assertThat(schemeCatalogRepository.findAll()).isEmpty();
	}

	@Test
	void saveAllPersistsMultiple() {
		List<SchemeCatalog> schemes = List.of(buildSchemeCatalog("PM Kisan"), buildSchemeCatalog("Crop Insurance"));

		schemeCatalogRepository.saveAll(schemes);

		assertThat(schemeCatalogRepository.count()).isEqualTo(2);
	}

	@Test
	void generatedIdIsAssigned() {
		SchemeCatalog saved = schemeCatalogRepository.save(buildSchemeCatalog());

		assertThat(saved.getSchemeId()).isNotNull();
	}
}

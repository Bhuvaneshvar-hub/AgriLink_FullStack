package com.cognizant.agrilink.subsidy.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.subsidy.entity.SchemeCatalog;
import com.cognizant.agrilink.subsidy.enums.Status;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class SchemeCatalogRepositoryTest {

	@Autowired
	private SchemeCatalogRepository schemeCatalogRepository;

	private SchemeCatalog buildSchemeCatalog() {
		return buildSchemeCatalog("PM Kisan");
	}

	private SchemeCatalog buildSchemeCatalog(String schemeName) {
		return SchemeCatalog.builder()
				.schemeName(schemeName)
				.category("DirectBenefit")
				.eligibilityCriteria("Small and marginal farmers")
				.benefitAmount(6000.0)
				.fundingSource("Central")
				.startDate(LocalDate.of(2026, 1, 1))
				.endDate(LocalDate.of(2026, 12, 31))
				.status(Status.AC)
				.build();
	}

	@Test
	void saveAndFindById() {
		SchemeCatalog saved = schemeCatalogRepository.save(buildSchemeCatalog());

		SchemeCatalog found = schemeCatalogRepository.findById(saved.getSchemeId()).orElseThrow();

		assertThat(found.getSchemeName()).isEqualTo("PM Kisan");
		assertThat(found.getCategory()).isEqualTo("DirectBenefit");
	}

	@Test
	void findAllReturnsSavedRecords() {
		schemeCatalogRepository.save(buildSchemeCatalog("PM Kisan"));
		schemeCatalogRepository.save(buildSchemeCatalog("Crop Insurance"));

		assertThat(schemeCatalogRepository.findAll()).hasSize(2);
	}

	@Test
	void deleteRemovesRecord() {
		SchemeCatalog saved = schemeCatalogRepository.save(buildSchemeCatalog());

		schemeCatalogRepository.deleteById(saved.getSchemeId());

		assertThat(schemeCatalogRepository.findById(saved.getSchemeId())).isEmpty();
	}
}

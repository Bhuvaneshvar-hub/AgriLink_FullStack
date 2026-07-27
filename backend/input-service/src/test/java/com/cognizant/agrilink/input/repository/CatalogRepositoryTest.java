package com.cognizant.agrilink.input.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.input.entity.Catalog;
import com.cognizant.agrilink.input.enums.Status;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class CatalogRepositoryTest {

	@Autowired
	private CatalogRepository catalogRepository;

	private Catalog buildCatalog() {
		return buildCatalog("Urea");
	}

	private Catalog buildCatalog(String name) {
		return Catalog.builder()
				.name(name)
				.category("Fertiliser")
				.unit("Kg")
				.pricePerUnit(45.5)
				.subsidisedPrice(30.0)
				.availableStock(500)
				.status(Status.AC)
				.build();
	}

	@Test
	void saveAndFindById() {
		Catalog saved = catalogRepository.save(buildCatalog());

		Catalog found = catalogRepository.findById(saved.getInputId()).orElseThrow();

		assertThat(found.getName()).isEqualTo("Urea");
		assertThat(found.getCategory()).isEqualTo("Fertiliser");
	}

	@Test
	void findAllReturnsSavedRecords() {
		catalogRepository.save(buildCatalog("Urea"));
		catalogRepository.save(buildCatalog("Potash"));

		assertThat(catalogRepository.findAll()).hasSize(2);
	}

	@Test
	void deleteRemovesRecord() {
		Catalog saved = catalogRepository.save(buildCatalog());

		catalogRepository.deleteById(saved.getInputId());

		assertThat(catalogRepository.findById(saved.getInputId())).isEmpty();
	}
}

package com.cognizant.agrilink.input.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.input.entity.Catalog;
import com.cognizant.agrilink.input.enums.Status;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class CatalogRepositoryExtendedTest {

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

	@ParameterizedTest
	@EnumSource(Status.class)
	void saveWithVariousStatuses(Status status) {
		Catalog catalog = buildCatalog();
		catalog.setStatus(status);

		Catalog saved = catalogRepository.save(catalog);

		assertThat(catalogRepository.findById(saved.getInputId()).orElseThrow().getStatus())
				.isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(strings = {"Seed", "Fertiliser", "Pesticide", "Equipment"})
	void saveWithVariousCategories(String category) {
		Catalog catalog = buildCatalog();
		catalog.setCategory(category);

		Catalog saved = catalogRepository.save(catalog);

		assertThat(catalogRepository.findById(saved.getInputId()).orElseThrow().getCategory())
				.isEqualTo(category);
	}

	@ParameterizedTest
	@ValueSource(strings = {"Kg", "Litre", "Packet", "Piece"})
	void saveWithVariousUnits(String unit) {
		Catalog catalog = buildCatalog();
		catalog.setUnit(unit);

		Catalog saved = catalogRepository.save(catalog);

		assertThat(catalogRepository.findById(saved.getInputId()).orElseThrow().getUnit())
				.isEqualTo(unit);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.01, 1.0, 99.99, 10000.0})
	void saveWithBoundaryPrices(double price) {
		Catalog catalog = buildCatalog();
		catalog.setPricePerUnit(price);

		Catalog saved = catalogRepository.save(catalog);

		assertThat(catalogRepository.findById(saved.getInputId()).orElseThrow().getPricePerUnit())
				.isEqualTo(price);
	}

	@ParameterizedTest
	@ValueSource(ints = {0, 1, 100, 9999, 1000000})
	void saveWithBoundaryStock(int stock) {
		Catalog catalog = buildCatalog();
		catalog.setAvailableStock(stock);

		Catalog saved = catalogRepository.save(catalog);

		assertThat(catalogRepository.findById(saved.getInputId()).orElseThrow().getAvailableStock())
				.isEqualTo(stock);
	}

	@ParameterizedTest
	@CsvSource({
			"Maize Seed,Seed,Packet",
			"DAP,Fertiliser,Kg",
			"Glyphosate,Pesticide,Litre",
			"Sprayer,Equipment,Piece"
	})
	void saveWithVariousCombinations(String name, String category, String unit) {
		Catalog catalog = buildCatalog();
		catalog.setName(name);
		catalog.setCategory(category);
		catalog.setUnit(unit);

		Catalog saved = catalogRepository.save(catalog);
		Catalog found = catalogRepository.findById(saved.getInputId()).orElseThrow();

		assertThat(found.getName()).isEqualTo(name);
		assertThat(found.getCategory()).isEqualTo(category);
		assertThat(found.getUnit()).isEqualTo(unit);
	}

	@ParameterizedTest
	@NullAndEmptySource
	void saveWithBlankOrNullName(String name) {
		Catalog catalog = buildCatalog();
		catalog.setName(name);

		Catalog saved = catalogRepository.save(catalog);

		assertThat(catalogRepository.findById(saved.getInputId()).orElseThrow().getName())
				.isEqualTo(name);
	}

	@Test
	void countReturnsZeroWhenEmpty() {
		assertThat(catalogRepository.count()).isZero();
	}

	@Test
	void countReturnsNumberOfRecords() {
		catalogRepository.save(buildCatalog("Urea"));
		catalogRepository.save(buildCatalog("Potash"));
		catalogRepository.save(buildCatalog("DAP"));

		assertThat(catalogRepository.count()).isEqualTo(3);
	}

	@Test
	void findAllReturnsEmptyWhenNoRecords() {
		assertThat(catalogRepository.findAll()).isEmpty();
	}

	@Test
	void findAllReturnsManyRecords() {
		for (int i = 0; i < 5; i++) {
			catalogRepository.save(buildCatalog("Urea-" + i));
		}

		assertThat(catalogRepository.findAll()).hasSize(5);
	}

	@Test
	void existsByIdReturnsTrueForSaved() {
		Catalog saved = catalogRepository.save(buildCatalog());

		assertThat(catalogRepository.existsById(saved.getInputId())).isTrue();
	}

	@Test
	void existsByIdReturnsFalseForMissing() {
		assertThat(catalogRepository.existsById(9999)).isFalse();
	}

	@Test
	void findByIdReturnsEmptyForMissing() {
		assertThat(catalogRepository.findById(9999)).isEmpty();
	}

	@Test
	void updateNameField() {
		Catalog saved = catalogRepository.save(buildCatalog());
		saved.setName("Potash");

		Catalog updated = catalogRepository.save(saved);

		assertThat(catalogRepository.findById(updated.getInputId()).orElseThrow().getName())
				.isEqualTo("Potash");
	}

	@Test
	void updatePriceField() {
		Catalog saved = catalogRepository.save(buildCatalog());
		saved.setPricePerUnit(99.99);

		catalogRepository.save(saved);

		assertThat(catalogRepository.findById(saved.getInputId()).orElseThrow().getPricePerUnit())
				.isEqualTo(99.99);
	}

	@Test
	void updateStockField() {
		Catalog saved = catalogRepository.save(buildCatalog());
		saved.setAvailableStock(0);

		catalogRepository.save(saved);

		assertThat(catalogRepository.findById(saved.getInputId()).orElseThrow().getAvailableStock())
				.isZero();
	}

	@Test
	void updateStatusField() {
		Catalog saved = catalogRepository.save(buildCatalog());
		saved.setStatus(Status.IN);

		catalogRepository.save(saved);

		assertThat(catalogRepository.findById(saved.getInputId()).orElseThrow().getStatus())
				.isEqualTo(Status.IN);
	}

	@Test
	void deleteThenGone() {
		Catalog saved = catalogRepository.save(buildCatalog());

		catalogRepository.delete(saved);

		assertThat(catalogRepository.findById(saved.getInputId())).isEmpty();
	}

	@Test
	void deleteAllRemovesEverything() {
		catalogRepository.save(buildCatalog("Urea"));
		catalogRepository.save(buildCatalog("Potash"));

		catalogRepository.deleteAll();

		assertThat(catalogRepository.findAll()).isEmpty();
	}

	@Test
	void savePersistsSubsidisedPrice() {
		Catalog catalog = buildCatalog();
		catalog.setSubsidisedPrice(25.5);

		Catalog saved = catalogRepository.save(catalog);

		assertThat(catalogRepository.findById(saved.getInputId()).orElseThrow().getSubsidisedPrice())
				.isEqualTo(25.5);
	}

	@Test
	void generatedIdIsNotNull() {
		Catalog saved = catalogRepository.save(buildCatalog());

		assertThat(saved.getInputId()).isNotNull();
	}
}

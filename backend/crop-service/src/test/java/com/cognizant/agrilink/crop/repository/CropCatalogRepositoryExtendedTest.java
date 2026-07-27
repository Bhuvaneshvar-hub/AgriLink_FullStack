package com.cognizant.agrilink.crop.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.crop.enums.Status;
import com.cognizant.agrilink.crop.entity.CropCatalog;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class CropCatalogRepositoryExtendedTest {

	@Autowired
	private CropCatalogRepository cropCatalogRepository;

	private CropCatalog buildCropCatalog() {
		return CropCatalog.builder()
				.cropName("Wheat")
				.category("Cereal")
				.season("Rabi")
				.typicalDurationDays(120)
				.expectedYieldPerAcre(20.5)
				.status(Status.AC)
				.build();
	}

	@Test
	void countReturnsNumberOfRecords() {
		CropCatalog first = buildCropCatalog();
		first.setCropName("Wheat");
		CropCatalog second = buildCropCatalog();
		second.setCropName("Rice");
		cropCatalogRepository.save(first);
		cropCatalogRepository.save(second);

		assertThat(cropCatalogRepository.count()).isEqualTo(2);
	}

	@Test
	void existsByIdReturnsTrueWhenPresent() {
		CropCatalog saved = cropCatalogRepository.save(buildCropCatalog());

		assertThat(cropCatalogRepository.existsById(saved.getCropId())).isTrue();
	}

	@Test
	void existsByIdReturnsFalseWhenMissing() {
		assertThat(cropCatalogRepository.existsById(9999)).isFalse();
	}

	@Test
	void findAllReturnsEmptyInitially() {
		assertThat(cropCatalogRepository.findAll()).isEmpty();
	}

	@Test
	void findByIdReturnsEmptyWhenMissing() {
		assertThat(cropCatalogRepository.findById(12345)).isEmpty();
	}

	@Test
	void saveMultipleRecords() {
		CropCatalog first = buildCropCatalog();
		first.setCropName("Wheat");
		CropCatalog second = buildCropCatalog();
		second.setCropName("Rice");
		CropCatalog third = buildCropCatalog();
		third.setCropName("Maize");
		cropCatalogRepository.save(first);
		cropCatalogRepository.save(second);
		cropCatalogRepository.save(third);

		assertThat(cropCatalogRepository.findAll()).hasSize(3);
	}

	@Test
	void updateCropNamePersists() {
		CropCatalog saved = cropCatalogRepository.save(buildCropCatalog());

		saved.setCropName("Barley");
		cropCatalogRepository.save(saved);

		assertThat(cropCatalogRepository.findById(saved.getCropId()).orElseThrow().getCropName())
				.isEqualTo("Barley");
	}

	@Test
	void updateStatusPersists() {
		CropCatalog saved = cropCatalogRepository.save(buildCropCatalog());

		saved.setStatus(Status.IN);
		cropCatalogRepository.save(saved);

		assertThat(cropCatalogRepository.findById(saved.getCropId()).orElseThrow().getStatus())
				.isEqualTo(Status.IN);
	}

	@Test
	void deleteThenGone() {
		CropCatalog saved = cropCatalogRepository.save(buildCropCatalog());

		cropCatalogRepository.delete(saved);

		assertThat(cropCatalogRepository.existsById(saved.getCropId())).isFalse();
	}

	@Test
	void persistsNullableFields() {
		CropCatalog catalog = CropCatalog.builder()
				.cropName(null)
				.category(null)
				.season(null)
				.typicalDurationDays(null)
				.expectedYieldPerAcre(null)
				.status(null)
				.build();

		CropCatalog saved = cropCatalogRepository.save(catalog);

		assertThat(cropCatalogRepository.findById(saved.getCropId())).isPresent();
	}

	@ParameterizedTest
	@ValueSource(strings = { "Kharif", "Rabi", "Zaid", "Perennial" })
	void persistsVariousSeasons(String season) {
		CropCatalog catalog = buildCropCatalog();
		catalog.setSeason(season);

		CropCatalog saved = cropCatalogRepository.save(catalog);

		assertThat(cropCatalogRepository.findById(saved.getCropId()).orElseThrow().getSeason())
				.isEqualTo(season);
	}

	@ParameterizedTest
	@ValueSource(strings = { "Cereal", "Pulse", "Oilseed", "Vegetable", "Fruit" })
	void persistsVariousCategories(String category) {
		CropCatalog catalog = buildCropCatalog();
		catalog.setCategory(category);

		CropCatalog saved = cropCatalogRepository.save(catalog);

		assertThat(cropCatalogRepository.findById(saved.getCropId()).orElseThrow().getCategory())
				.isEqualTo(category);
	}

	@ParameterizedTest
	@ValueSource(ints = { 1, 30, 90, 120, 365 })
	void persistsBoundaryDurations(int duration) {
		CropCatalog catalog = buildCropCatalog();
		catalog.setTypicalDurationDays(duration);

		CropCatalog saved = cropCatalogRepository.save(catalog);

		assertThat(cropCatalogRepository.findById(saved.getCropId()).orElseThrow().getTypicalDurationDays())
				.isEqualTo(duration);
	}

	@ParameterizedTest
	@CsvSource({
			"Wheat,Cereal,20.5",
			"Rice,Cereal,30.0",
			"Cotton,Cash,8.25",
			"Maize,Cereal,15.75"
	})
	void persistsCsvCatalogs(String cropName, String category, double yield) {
		CropCatalog catalog = CropCatalog.builder()
				.cropName(cropName)
				.category(category)
				.season("Kharif")
				.typicalDurationDays(100)
				.expectedYieldPerAcre(yield)
				.status(Status.AC)
				.build();

		CropCatalog saved = cropCatalogRepository.save(catalog);

		CropCatalog found = cropCatalogRepository.findById(saved.getCropId()).orElseThrow();
		assertThat(found.getCropName()).isEqualTo(cropName);
		assertThat(found.getExpectedYieldPerAcre()).isEqualTo(yield);
	}
}

package com.cognizant.agrilink.crop.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.crop.enums.Status;
import com.cognizant.agrilink.crop.entity.CropCatalog;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class CropCatalogRepositoryTest {

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
	void saveAndFindById() {
		CropCatalog saved = cropCatalogRepository.save(buildCropCatalog());

		CropCatalog found = cropCatalogRepository.findById(saved.getCropId()).orElseThrow();

		assertThat(found.getCropName()).isEqualTo("Wheat");
		assertThat(found.getCategory()).isEqualTo("Cereal");
	}

	@Test
	void findAllReturnsSavedRecords() {
		CropCatalog first = buildCropCatalog();
		first.setCropName("Wheat");
		CropCatalog second = buildCropCatalog();
		second.setCropName("Rice");
		cropCatalogRepository.save(first);
		cropCatalogRepository.save(second);

		assertThat(cropCatalogRepository.findAll()).hasSize(2);
	}

	@Test
	void deleteRemovesRecord() {
		CropCatalog saved = cropCatalogRepository.save(buildCropCatalog());

		cropCatalogRepository.deleteById(saved.getCropId());

		assertThat(cropCatalogRepository.findById(saved.getCropId())).isEmpty();
	}
}

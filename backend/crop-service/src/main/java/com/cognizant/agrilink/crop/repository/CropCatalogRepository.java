package com.cognizant.agrilink.crop.repository;

import com.cognizant.agrilink.crop.entity.CropCatalog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CropCatalogRepository extends JpaRepository<CropCatalog, Integer> {

	boolean existsByCropNameIgnoreCase(String cropName);
}

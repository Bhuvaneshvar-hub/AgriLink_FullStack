package com.cognizant.agrilink.input.repository;

import com.cognizant.agrilink.input.entity.Catalog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CatalogRepository extends JpaRepository<Catalog, Integer> {

	boolean existsByNameIgnoreCase(String name);

	boolean existsByNameIgnoreCaseAndInputIdNot(String name, Integer inputId);
}

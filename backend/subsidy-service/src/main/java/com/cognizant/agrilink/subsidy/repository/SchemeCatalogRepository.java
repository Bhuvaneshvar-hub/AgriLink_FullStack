package com.cognizant.agrilink.subsidy.repository;

import com.cognizant.agrilink.subsidy.entity.SchemeCatalog;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SchemeCatalogRepository extends JpaRepository<SchemeCatalog, Integer> {

	boolean existsBySchemeNameIgnoreCase(String schemeName);
}

package com.cognizant.agrilink.subsidy.repository;

import com.cognizant.agrilink.subsidy.entity.SubsidyApplication;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SubsidyApplicationRepository extends JpaRepository<SubsidyApplication, Integer> {

	List<SubsidyApplication> findByUserId(Integer userId);

	List<SubsidyApplication> findByFarmerId(Integer farmerId);

	boolean existsByFarmerIdAndSchemeId(Integer farmerId, Integer schemeId);
}

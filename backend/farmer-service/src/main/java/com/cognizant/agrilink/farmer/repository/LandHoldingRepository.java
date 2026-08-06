package com.cognizant.agrilink.farmer.repository;

import com.cognizant.agrilink.farmer.entity.LandHolding;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface LandHoldingRepository extends JpaRepository<LandHolding, Integer> {

	List<LandHolding> findByFarmerIdIn(List<Integer> farmerIds);

	boolean existsBySurveyNumber(String surveyNumber);

	boolean existsBySurveyNumberAndHoldingIdNot(String surveyNumber, Integer holdingId);
}

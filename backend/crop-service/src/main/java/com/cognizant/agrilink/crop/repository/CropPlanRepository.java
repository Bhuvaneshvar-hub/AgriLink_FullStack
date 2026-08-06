package com.cognizant.agrilink.crop.repository;

import com.cognizant.agrilink.crop.entity.CropPlan;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CropPlanRepository extends JpaRepository<CropPlan, Integer> {

	boolean existsByFarmerIdAndHoldingIdAndCropIdAndSeasonAndYear(
			Integer farmerId, Integer holdingId, Integer cropId, String season, Integer year);

	// Used to scope a Farmer's view to only the plans belonging to their own
	// farmer profiles.
	List<CropPlan> findByFarmerIdIn(Collection<Integer> farmerIds);
}

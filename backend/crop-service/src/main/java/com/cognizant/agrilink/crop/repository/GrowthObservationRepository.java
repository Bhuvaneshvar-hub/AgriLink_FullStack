package com.cognizant.agrilink.crop.repository;

import com.cognizant.agrilink.crop.entity.GrowthObservation;
import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GrowthObservationRepository extends JpaRepository<GrowthObservation, Integer> {

	List<GrowthObservation> findByPlanId(Integer planId);

	List<GrowthObservation> findByPlanIdIn(Collection<Integer> planIds);
}

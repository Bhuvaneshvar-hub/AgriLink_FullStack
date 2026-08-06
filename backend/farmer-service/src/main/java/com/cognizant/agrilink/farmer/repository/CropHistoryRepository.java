package com.cognizant.agrilink.farmer.repository;

import com.cognizant.agrilink.farmer.entity.CropHistory;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CropHistoryRepository extends JpaRepository<CropHistory, Integer> {

	List<CropHistory> findByFarmerIdIn(List<Integer> farmerIds);

	List<CropHistory> findByHoldingId(Integer holdingId);
}

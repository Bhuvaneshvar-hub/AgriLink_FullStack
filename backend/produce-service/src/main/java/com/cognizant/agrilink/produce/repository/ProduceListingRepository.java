package com.cognizant.agrilink.produce.repository;

import com.cognizant.agrilink.produce.entity.ProduceListing;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProduceListingRepository extends JpaRepository<ProduceListing, Integer> {

	List<ProduceListing> findByFarmerIdIn(List<Integer> farmerIds);
}

package com.cognizant.agrilink.farmer.repository;

import com.cognizant.agrilink.farmer.entity.FarmerProfile;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface FarmerProfileRepository extends JpaRepository<FarmerProfile, Integer> {

	List<FarmerProfile> findByUserId(Integer userId);

	List<FarmerProfile> findByRegionId(Integer regionId);

	boolean existsByNationalIdNumber(String nationalIdNumber);

	boolean existsByNationalIdNumberAndFarmerIdNot(String nationalIdNumber, Integer farmerId);
}

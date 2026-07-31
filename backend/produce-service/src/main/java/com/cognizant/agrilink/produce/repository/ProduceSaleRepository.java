package com.cognizant.agrilink.produce.repository;

import com.cognizant.agrilink.produce.entity.ProduceSale;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProduceSaleRepository extends JpaRepository<ProduceSale, Integer> {

	List<ProduceSale> findByListingId(Integer listingId);

	List<ProduceSale> findByListingIdIn(List<Integer> listingIds);
}

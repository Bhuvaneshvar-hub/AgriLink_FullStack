package com.cognizant.agrilink.produce.repository;

import com.cognizant.agrilink.produce.entity.ProduceSale;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ProduceSaleRepository extends JpaRepository<ProduceSale, Integer> {
}

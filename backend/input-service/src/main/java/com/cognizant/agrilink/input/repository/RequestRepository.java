package com.cognizant.agrilink.input.repository;

import com.cognizant.agrilink.input.entity.Request;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RequestRepository extends JpaRepository<Request, Integer> {
}

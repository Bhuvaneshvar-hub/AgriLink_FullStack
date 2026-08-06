package com.cognizant.agrilink.input.repository;

import com.cognizant.agrilink.input.entity.Request;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RequestRepository extends JpaRepository<Request, Integer> {
}

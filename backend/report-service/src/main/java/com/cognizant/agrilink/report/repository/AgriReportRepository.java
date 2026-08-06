package com.cognizant.agrilink.report.repository;

import com.cognizant.agrilink.report.entity.AgriReport;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AgriReportRepository extends JpaRepository<AgriReport, Integer> {
	java.util.List<AgriReport> findByScope(String scope);
}

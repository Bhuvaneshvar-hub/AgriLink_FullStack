package com.cognizant.agrilink.report.service;

import com.cognizant.agrilink.report.dto.AgriReportDto;
import com.cognizant.agrilink.report.entity.AgriReport;
import com.cognizant.agrilink.report.repository.AgriReportRepository;
import com.cognizant.agrilink.report.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class AgriReportService {

	private final AgriReportRepository agriReportRepository;

	public AgriReportService(AgriReportRepository agriReportRepository) {
		this.agriReportRepository = agriReportRepository;
	}

	public List<AgriReport> getAll() {
		return agriReportRepository.findAll();
	}

	public AgriReport getById(Integer id) {
		return agriReportRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("AgriReport not found with id " + id));
	}

	public AgriReport create(AgriReportDto dto) {
		AgriReport agriReport = AgriReport.builder()
				.generatedBy(dto.getGeneratedBy())
				.scope(dto.getScope())
				.metrics(dto.getMetrics())
				.generatedDate(dto.getGeneratedDate())
				.build();
		return agriReportRepository.save(agriReport);
	}

	public AgriReport update(Integer id, AgriReportDto dto) {
		AgriReport agriReport = getById(id);
		agriReport.setGeneratedBy(dto.getGeneratedBy());
		agriReport.setScope(dto.getScope());
		agriReport.setMetrics(dto.getMetrics());
		agriReport.setGeneratedDate(dto.getGeneratedDate());
		return agriReportRepository.save(agriReport);
	}

	public List<AgriReport> getByScope(String scope) {
		return agriReportRepository.findByScope(scope);
	}

	public void delete(Integer id) {
		AgriReport agriReport = getById(id);
		agriReportRepository.delete(agriReport);
	}
}

package com.cognizant.agrilink.subsidy.service;

import com.cognizant.agrilink.subsidy.dto.SchemeCatalogDto;
import com.cognizant.agrilink.subsidy.entity.SchemeCatalog;
import com.cognizant.agrilink.subsidy.repository.SchemeCatalogRepository;
import com.cognizant.agrilink.subsidy.enums.Status;
import com.cognizant.agrilink.subsidy.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class SchemeCatalogService {

	private final SchemeCatalogRepository schemeCatalogRepository;

	public SchemeCatalogService(SchemeCatalogRepository schemeCatalogRepository) {
		this.schemeCatalogRepository = schemeCatalogRepository;
	}

	public List<SchemeCatalog> getAll() {
		return schemeCatalogRepository.findAll();
	}

	public SchemeCatalog getById(Integer id) {
		return schemeCatalogRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Scheme not found with id " + id));
	}

	public SchemeCatalog create(SchemeCatalogDto dto) {
		if (dto.getSchemeName() != null
				&& schemeCatalogRepository.existsBySchemeNameIgnoreCase(dto.getSchemeName())) {
			throw new IllegalStateException("A scheme with this name already exists");
		}
		SchemeCatalog schemeCatalog = SchemeCatalog.builder()
				.schemeName(dto.getSchemeName())
				.category(dto.getCategory())
				.eligibilityCriteria(dto.getEligibilityCriteria())
				.benefitAmount(dto.getBenefitAmount())
				.fundingSource(dto.getFundingSource())
				.startDate(dto.getStartDate())
				.endDate(dto.getEndDate())
				.status(dto.getStatus() != null ? dto.getStatus() : Status.AC)
				.build();
		return schemeCatalogRepository.save(schemeCatalog);
	}

	public SchemeCatalog update(Integer id, SchemeCatalogDto dto) {
		SchemeCatalog schemeCatalog = getById(id);
		if (dto.getSchemeName() != null
				&& !dto.getSchemeName().equalsIgnoreCase(schemeCatalog.getSchemeName())
				&& schemeCatalogRepository.existsBySchemeNameIgnoreCase(dto.getSchemeName())) {
			throw new IllegalStateException("A scheme with this name already exists");
		}
		schemeCatalog.setSchemeName(dto.getSchemeName());
		schemeCatalog.setCategory(dto.getCategory());
		schemeCatalog.setEligibilityCriteria(dto.getEligibilityCriteria());
		schemeCatalog.setBenefitAmount(dto.getBenefitAmount());
		schemeCatalog.setFundingSource(dto.getFundingSource());
		schemeCatalog.setStartDate(dto.getStartDate());
		schemeCatalog.setEndDate(dto.getEndDate());
		schemeCatalog.setStatus(dto.getStatus());
		return schemeCatalogRepository.save(schemeCatalog);
	}

	public SchemeCatalog updateStatus(Integer id, Status status) {
		SchemeCatalog schemeCatalog = getById(id);
		schemeCatalog.setStatus(status);
		return schemeCatalogRepository.save(schemeCatalog);
	}

	public void delete(Integer id) {
		SchemeCatalog schemeCatalog = getById(id);
		schemeCatalogRepository.delete(schemeCatalog);
	}
}

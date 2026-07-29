package com.cognizant.agrilink.crop.service;

import com.cognizant.agrilink.crop.dto.CropCatalogDto;
import com.cognizant.agrilink.crop.entity.CropCatalog;
import com.cognizant.agrilink.crop.enums.Status;
import com.cognizant.agrilink.crop.repository.CropCatalogRepository;
import com.cognizant.agrilink.crop.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CropCatalogService {

	private final CropCatalogRepository cropCatalogRepository;

	public CropCatalogService(CropCatalogRepository cropCatalogRepository) {
		this.cropCatalogRepository = cropCatalogRepository;
	}

	public List<CropCatalog> getAll() {
		return cropCatalogRepository.findAll();
	}

	public CropCatalog getById(Integer id) {
		return cropCatalogRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("CropCatalog not found with id " + id));
	}

	public CropCatalog create(CropCatalogDto dto) {
		if (dto.getCropName() != null
				&& cropCatalogRepository.existsByCropNameIgnoreCase(dto.getCropName())) {
			throw new IllegalStateException("A crop already exists with name '" + dto.getCropName() + "'");
		}
		CropCatalog cropCatalog = CropCatalog.builder()
				.cropName(dto.getCropName())
				.category(dto.getCategory())
				.season(dto.getSeason())
				.typicalDurationDays(dto.getTypicalDurationDays())
				.expectedYieldPerAcre(dto.getExpectedYieldPerAcre())
				.description(dto.getDescription())
				.status(dto.getStatus() != null ? dto.getStatus() : Status.AC)
				.build();
		return cropCatalogRepository.save(cropCatalog);
	}

	public CropCatalog update(Integer id, CropCatalogDto dto) {
		CropCatalog cropCatalog = getById(id);
		if (dto.getCropName() != null
				&& !dto.getCropName().equalsIgnoreCase(cropCatalog.getCropName())
				&& cropCatalogRepository.existsByCropNameIgnoreCase(dto.getCropName())) {
			throw new IllegalStateException("A crop already exists with name '" + dto.getCropName() + "'");
		}
		cropCatalog.setCropName(dto.getCropName());
		cropCatalog.setCategory(dto.getCategory());
		cropCatalog.setSeason(dto.getSeason());
		cropCatalog.setTypicalDurationDays(dto.getTypicalDurationDays());
		cropCatalog.setExpectedYieldPerAcre(dto.getExpectedYieldPerAcre());
		cropCatalog.setDescription(dto.getDescription());
		cropCatalog.setStatus(dto.getStatus());
		return cropCatalogRepository.save(cropCatalog);
	}

	public void delete(Integer id) {
		CropCatalog cropCatalog = getById(id);
		cropCatalogRepository.delete(cropCatalog);
	}
}

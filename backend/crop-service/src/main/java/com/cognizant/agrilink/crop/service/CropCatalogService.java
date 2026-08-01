package com.cognizant.agrilink.crop.service;

import com.cognizant.agrilink.crop.dto.CropCatalogDto;
import com.cognizant.agrilink.crop.entity.CropCatalog;
import com.cognizant.agrilink.crop.enums.Season;
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
				.season(normaliseSeason(dto.getSeason()))
				.typicalDurationDays(dto.getTypicalDurationDays())
				.expectedYieldPerAcre(dto.getExpectedYieldPerAcre())
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
		cropCatalog.setSeason(normaliseSeason(dto.getSeason()));
		cropCatalog.setTypicalDurationDays(dto.getTypicalDurationDays());
		cropCatalog.setExpectedYieldPerAcre(dto.getExpectedYieldPerAcre());
		cropCatalog.setStatus(dto.getStatus());
		return cropCatalogRepository.save(cropCatalog);
	}

	public void delete(Integer id) {
		CropCatalog cropCatalog = getById(id);
		cropCatalogRepository.delete(cropCatalog);
	}

	// Validate the incoming season against the known set and return its canonical
	// label (e.g. "kharif" -> "Kharif") so the catalog is never seeded with a typo.
	private String normaliseSeason(String season) {
		return Season.fromLabel(season)
				.map(Season::getLabel)
				.orElseThrow(() -> new IllegalArgumentException(
						"Invalid season '" + season + "'. Must be one of: Kharif, Rabi, Zaid, Perennial"));
	}
}

package com.cognizant.agrilink.crop.service;

import com.cognizant.agrilink.crop.dto.CropPlanDto;
import com.cognizant.agrilink.crop.entity.CropCatalog;
import com.cognizant.agrilink.crop.entity.CropPlan;
import com.cognizant.agrilink.crop.enums.PlanStatus;
import com.cognizant.agrilink.crop.enums.Season;
import com.cognizant.agrilink.crop.repository.CropCatalogRepository;
import com.cognizant.agrilink.crop.repository.CropPlanRepository;
import com.cognizant.agrilink.crop.exception.ResourceNotFoundException;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CropPlanService {

	private final CropPlanRepository cropPlanRepository;
	private final CropCatalogRepository cropCatalogRepository;

	public CropPlanService(CropPlanRepository cropPlanRepository,
			CropCatalogRepository cropCatalogRepository) {
		this.cropPlanRepository = cropPlanRepository;
		this.cropCatalogRepository = cropCatalogRepository;
	}

	public List<CropPlan> getAll() {
		return cropPlanRepository.findAll();
	}

	// Only the plans owned by the given farmer-profile ids. An empty/blank input
	// yields no plans (a farmer with no profile sees nothing).
	public List<CropPlan> getByFarmerIds(Collection<Integer> farmerIds) {
		if (farmerIds == null || farmerIds.isEmpty()) {
			return Collections.emptyList();
		}
		return cropPlanRepository.findByFarmerIdIn(farmerIds);
	}

	public CropPlan getById(Integer id) {
		return cropPlanRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("CropPlan not found with id " + id));
	}

	public CropPlan create(CropPlanDto dto) {
		validateDates(dto);
		String season = resolveAndValidateSeason(dto);
		if (cropPlanRepository.existsByFarmerIdAndHoldingIdAndCropIdAndSeasonAndYear(
				dto.getFarmerId(), dto.getHoldingId(), dto.getCropId(), season, dto.getYear())) {
			throw new IllegalStateException(
					"A crop plan already exists for this holding/crop/season");
		}
		CropPlan cropPlan = CropPlan.builder()
				.farmerId(dto.getFarmerId())
				.holdingId(dto.getHoldingId())
				.cropId(dto.getCropId())
				.season(season)
				.year(dto.getYear())
				.sowingDate(dto.getSowingDate())
				.expectedHarvestDate(dto.getExpectedHarvestDate())
				.areaPlanted(dto.getAreaPlanted())
				.status(dto.getStatus() != null ? dto.getStatus() : PlanStatus.PLANNED)
				.build();
		return cropPlanRepository.save(cropPlan);
	}

	public CropPlan update(Integer id, CropPlanDto dto) {
		CropPlan cropPlan = getById(id);
		validateDates(dto);
		String season = resolveAndValidateSeason(dto);
		cropPlan.setFarmerId(dto.getFarmerId());
		cropPlan.setHoldingId(dto.getHoldingId());
		cropPlan.setCropId(dto.getCropId());
		cropPlan.setSeason(season);
		cropPlan.setYear(dto.getYear());
		cropPlan.setSowingDate(dto.getSowingDate());
		cropPlan.setExpectedHarvestDate(dto.getExpectedHarvestDate());
		cropPlan.setAreaPlanted(dto.getAreaPlanted());
		cropPlan.setStatus(dto.getStatus());
		return cropPlanRepository.save(cropPlan);
	}

	public void delete(Integer id) {
		CropPlan cropPlan = getById(id);
		cropPlanRepository.delete(cropPlan);
	}

	// The expected harvest date must be strictly after the sowing date.
	private void validateDates(CropPlanDto dto) {
		if (dto.getSowingDate() != null && dto.getExpectedHarvestDate() != null
				&& !dto.getExpectedHarvestDate().isAfter(dto.getSowingDate())) {
			throw new IllegalArgumentException(
					"Expected harvest date must be after the sowing date");
		}
	}

	// A plan's season must (a) be a known season and (b) match the season of the
	// crop it is planted with, so a Rabi crop can't be scheduled in a Kharif plan.
	// Returns the canonical season label to persist.
	private String resolveAndValidateSeason(CropPlanDto dto) {
		String label = Season.fromLabel(dto.getSeason())
				.map(Season::getLabel)
				.orElseThrow(() -> new IllegalArgumentException(
						"Invalid season '" + dto.getSeason() + "'. Must be one of: Kharif, Rabi, Zaid, Perennial"));

		if (dto.getCropId() != null) {
			CropCatalog crop = cropCatalogRepository.findById(dto.getCropId())
					.orElseThrow(() -> new ResourceNotFoundException(
							"CropCatalog not found with id " + dto.getCropId()));
			if (crop.getSeason() != null && !crop.getSeason().equalsIgnoreCase(label)) {
				throw new IllegalStateException(
						"Crop '" + crop.getCropName() + "' belongs to the " + crop.getSeason()
								+ " season and cannot be planted in a " + label + " plan");
			}
		}
		return label;
	}
}

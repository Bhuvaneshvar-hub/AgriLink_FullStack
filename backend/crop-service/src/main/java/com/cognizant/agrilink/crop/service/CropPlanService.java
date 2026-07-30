package com.cognizant.agrilink.crop.service;

import com.cognizant.agrilink.crop.dto.CropPlanDto;
import com.cognizant.agrilink.crop.entity.CropPlan;
import com.cognizant.agrilink.crop.enums.PlanStatus;
import com.cognizant.agrilink.crop.repository.CropPlanRepository;
import com.cognizant.agrilink.crop.exception.ResourceNotFoundException;
import java.util.Collection;
import java.util.Collections;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CropPlanService {

	private final CropPlanRepository cropPlanRepository;

	public CropPlanService(CropPlanRepository cropPlanRepository) {
		this.cropPlanRepository = cropPlanRepository;
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
		if (cropPlanRepository.existsByFarmerIdAndHoldingIdAndCropIdAndSeasonAndYear(
				dto.getFarmerId(), dto.getHoldingId(), dto.getCropId(), dto.getSeason(), dto.getYear())) {
			throw new IllegalStateException(
					"A crop plan already exists for this holding/crop/season");
		}
		CropPlan cropPlan = CropPlan.builder()
				.farmerId(dto.getFarmerId())
				.holdingId(dto.getHoldingId())
				.cropId(dto.getCropId())
				.season(dto.getSeason())
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
		cropPlan.setFarmerId(dto.getFarmerId());
		cropPlan.setHoldingId(dto.getHoldingId());
		cropPlan.setCropId(dto.getCropId());
		cropPlan.setSeason(dto.getSeason());
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
}

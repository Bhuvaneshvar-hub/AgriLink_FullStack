package com.cognizant.agrilink.farmer.service;

import com.cognizant.agrilink.farmer.dto.LandHoldingDto;
import com.cognizant.agrilink.farmer.entity.LandHolding;
import com.cognizant.agrilink.farmer.enums.Status;
import com.cognizant.agrilink.farmer.repository.LandHoldingRepository;
import com.cognizant.agrilink.farmer.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class LandHoldingService {

	private final LandHoldingRepository landHoldingRepository;

	public LandHoldingService(LandHoldingRepository landHoldingRepository) {
		this.landHoldingRepository = landHoldingRepository;
	}

	public List<LandHolding> getAll() {
		return landHoldingRepository.findAll();
	}

	public List<LandHolding> getByFarmerIds(List<Integer> farmerIds) {
		if (farmerIds == null || farmerIds.isEmpty()) {
			return List.of();
		}
		return landHoldingRepository.findByFarmerIdIn(farmerIds);
	}

	public LandHolding getById(Integer id) {
		return landHoldingRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("LandHolding not found with id " + id));
	}

	public LandHolding create(LandHoldingDto dto) {
		if (dto.getSurveyNumber() != null
				&& landHoldingRepository.existsBySurveyNumber(dto.getSurveyNumber())) {
			throw new IllegalStateException(
					"A land holding already exists with survey number " + dto.getSurveyNumber());
		}
		LandHolding landHolding = LandHolding.builder()
				.farmerId(dto.getFarmerId())
				.surveyNumber(dto.getSurveyNumber())
				.areaAcres(dto.getAreaAcres())
				.soilType(dto.getSoilType())
				.irrigationSource(dto.getIrrigationSource())
				.ownershipType(dto.getOwnershipType())
				.status(dto.getStatus() != null ? dto.getStatus() : Status.AC)
				.build();
		return landHoldingRepository.save(landHolding);
	}

	public LandHolding update(Integer id, LandHoldingDto dto) {
		LandHolding landHolding = getById(id);
		if (dto.getSurveyNumber() != null
				&& landHoldingRepository.existsBySurveyNumberAndHoldingIdNot(
						dto.getSurveyNumber(), id)) {
			throw new IllegalStateException(
					"A land holding already exists with survey number " + dto.getSurveyNumber());
		}
		landHolding.setFarmerId(dto.getFarmerId());
		landHolding.setSurveyNumber(dto.getSurveyNumber());
		landHolding.setAreaAcres(dto.getAreaAcres());
		landHolding.setSoilType(dto.getSoilType());
		landHolding.setIrrigationSource(dto.getIrrigationSource());
		landHolding.setOwnershipType(dto.getOwnershipType());
		landHolding.setStatus(dto.getStatus());
		return landHoldingRepository.save(landHolding);
	}

	public void delete(Integer id) {
		LandHolding landHolding = getById(id);
		landHoldingRepository.delete(landHolding);
	}

	/** Sets a land holding's status — used by the admin approve (Active) / reject (Disputed) actions. */
	public LandHolding setStatus(Integer id, Status status) {
		LandHolding landHolding = getById(id);
		landHolding.setStatus(status);
		return landHoldingRepository.save(landHolding);
	}
}

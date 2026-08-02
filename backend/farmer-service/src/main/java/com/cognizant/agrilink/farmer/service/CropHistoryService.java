package com.cognizant.agrilink.farmer.service;

import com.cognizant.agrilink.farmer.dto.CropHistoryDto;
import com.cognizant.agrilink.farmer.entity.CropHistory;
import com.cognizant.agrilink.farmer.repository.CropHistoryRepository;
import com.cognizant.agrilink.farmer.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CropHistoryService {

	private final CropHistoryRepository cropHistoryRepository;

	public CropHistoryService(CropHistoryRepository cropHistoryRepository) {
		this.cropHistoryRepository = cropHistoryRepository;
	}

	public List<CropHistory> getAll() {
		return cropHistoryRepository.findAll();
	}

	public List<CropHistory> getByFarmerIds(List<Integer> farmerIds) {
		if (farmerIds == null || farmerIds.isEmpty()) {
			return List.of();
		}
		return cropHistoryRepository.findByFarmerIdIn(farmerIds);
	}

	public List<CropHistory> getByHoldingId(Integer holdingId) {
		return cropHistoryRepository.findByHoldingId(holdingId);
	}

	public CropHistory getById(Integer id) {
		return cropHistoryRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("CropHistory not found with id " + id));
	}

	public CropHistory create(CropHistoryDto dto) {
		CropHistory cropHistory = CropHistory.builder()
				.holdingId(dto.getHoldingId())
				.farmerId(dto.getFarmerId())
				.cropName(dto.getCropName())
				.season(dto.getSeason())
				.cropYear(dto.getCropYear())
				.areaAcres(dto.getAreaAcres())
				.yieldQuintals(dto.getYieldQuintals())
				.remarks(dto.getRemarks())
				.build();
		return cropHistoryRepository.save(cropHistory);
	}

	public CropHistory update(Integer id, CropHistoryDto dto) {
		CropHistory cropHistory = getById(id);
		cropHistory.setHoldingId(dto.getHoldingId());
		cropHistory.setFarmerId(dto.getFarmerId());
		cropHistory.setCropName(dto.getCropName());
		cropHistory.setSeason(dto.getSeason());
		cropHistory.setCropYear(dto.getCropYear());
		cropHistory.setAreaAcres(dto.getAreaAcres());
		cropHistory.setYieldQuintals(dto.getYieldQuintals());
		cropHistory.setRemarks(dto.getRemarks());
		return cropHistoryRepository.save(cropHistory);
	}

	public void delete(Integer id) {
		CropHistory cropHistory = getById(id);
		cropHistoryRepository.delete(cropHistory);
	}
}

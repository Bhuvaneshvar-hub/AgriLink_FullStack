package com.cognizant.agrilink.produce.service;

import com.cognizant.agrilink.produce.dto.ProduceListingDto;
import com.cognizant.agrilink.produce.entity.ProduceListing;
import com.cognizant.agrilink.produce.repository.ProduceListingRepository;
import com.cognizant.agrilink.produce.enums.ListingStatus;
import com.cognizant.agrilink.produce.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ProduceListingService {

	private final ProduceListingRepository produceListingRepository;

	public ProduceListingService(ProduceListingRepository produceListingRepository) {
		this.produceListingRepository = produceListingRepository;
	}

	public List<ProduceListing> getAll() {
		return produceListingRepository.findAll();
	}

	public ProduceListing getById(Integer id) {
		return produceListingRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("ProduceListing not found with id " + id));
	}

	public ProduceListing create(ProduceListingDto dto) {
		ProduceListing produceListing = ProduceListing.builder()
				.farmerId(dto.getFarmerId())
				.cropId(dto.getCropId())
				.harvestDate(dto.getHarvestDate())
				.quantityKg(dto.getQuantityKg())
				.qualityGrade(dto.getQualityGrade())
				.askingPricePerKg(dto.getAskingPricePerKg())
				.status(dto.getStatus() != null ? dto.getStatus() : ListingStatus.AV)
				.build();
		return produceListingRepository.save(produceListing);
	}

	public ProduceListing update(Integer id, ProduceListingDto dto) {
		ProduceListing produceListing = getById(id);
		produceListing.setFarmerId(dto.getFarmerId());
		produceListing.setCropId(dto.getCropId());
		produceListing.setHarvestDate(dto.getHarvestDate());
		produceListing.setQuantityKg(dto.getQuantityKg());
		produceListing.setQualityGrade(dto.getQualityGrade());
		produceListing.setAskingPricePerKg(dto.getAskingPricePerKg());
		produceListing.setStatus(dto.getStatus());
		return produceListingRepository.save(produceListing);
	}

	public void delete(Integer id) {
		ProduceListing produceListing = getById(id);
		produceListingRepository.delete(produceListing);
	}
}

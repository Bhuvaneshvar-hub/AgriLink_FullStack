package com.cognizant.agrilink.input.service;

import com.cognizant.agrilink.input.dto.CatalogDto;
import com.cognizant.agrilink.input.entity.Catalog;
import com.cognizant.agrilink.input.enums.Status;
import com.cognizant.agrilink.input.repository.CatalogRepository;
import com.cognizant.agrilink.input.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CatalogService {

	private final CatalogRepository catalogRepository;

	public CatalogService(CatalogRepository catalogRepository) {
		this.catalogRepository = catalogRepository;
	}

	public List<Catalog> getAll() {
		return catalogRepository.findAll();
	}

	public Catalog getById(Integer id) {
		return catalogRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Catalog not found with id " + id));
	}

	public Catalog create(CatalogDto dto) {
		if (dto.getName() != null && catalogRepository.existsByNameIgnoreCase(dto.getName())) {
			throw new IllegalStateException("A catalog entry already exists with name " + dto.getName());
		}
		Catalog catalog = Catalog.builder()
				.name(dto.getName())
				.category(dto.getCategory())
				.unit(dto.getUnit())
				.pricePerUnit(dto.getPricePerUnit())
				.subsidisedPrice(dto.getSubsidisedPrice())
				.availableStock(dto.getAvailableStock())
				.status(dto.getStatus() != null ? dto.getStatus() : Status.AC)
				.build();
		return catalogRepository.save(catalog);
	}

	public Catalog update(Integer id, CatalogDto dto) {
		Catalog catalog = getById(id);
		if (dto.getName() != null
				&& catalogRepository.existsByNameIgnoreCaseAndInputIdNot(dto.getName(), id)) {
			throw new IllegalStateException("A catalog entry already exists with name " + dto.getName());
		}
		catalog.setName(dto.getName());
		catalog.setCategory(dto.getCategory());
		catalog.setUnit(dto.getUnit());
		catalog.setPricePerUnit(dto.getPricePerUnit());
		catalog.setSubsidisedPrice(dto.getSubsidisedPrice());
		catalog.setAvailableStock(dto.getAvailableStock());
		catalog.setStatus(dto.getStatus());
		return catalogRepository.save(catalog);
	}

	public void delete(Integer id) {
		Catalog catalog = getById(id);
		catalogRepository.delete(catalog);
	}
}

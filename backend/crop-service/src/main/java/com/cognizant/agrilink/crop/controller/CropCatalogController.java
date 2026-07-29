package com.cognizant.agrilink.crop.controller;

import com.cognizant.agrilink.crop.dto.CropCatalogDto;
import com.cognizant.agrilink.crop.dto.MessageResponse;
import com.cognizant.agrilink.crop.entity.CropCatalog;
import com.cognizant.agrilink.crop.service.CropCatalogService;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/crop-catalogs")
public class CropCatalogController {

	private final CropCatalogService cropCatalogService;

	public CropCatalogController(CropCatalogService cropCatalogService) {
		this.cropCatalogService = cropCatalogService;
	}

	// GET methods return full data
	@GetMapping
	public ResponseEntity<List<CropCatalog>> getAll() {
		return ResponseEntity.ok(cropCatalogService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<CropCatalog> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(cropCatalogService.getById(id));
	}

	// Non-GET methods return only a message
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody CropCatalogDto dto) {
		cropCatalogService.create(dto);
		return ResponseEntity.ok(new MessageResponse("CropCatalog created successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody CropCatalogDto dto) {
		cropCatalogService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("CropCatalog updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id) {
		cropCatalogService.delete(id);
		return ResponseEntity.ok(new MessageResponse("CropCatalog deleted successfully"));
	}
}

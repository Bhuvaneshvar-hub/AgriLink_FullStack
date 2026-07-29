package com.cognizant.agrilink.input.controller;

import com.cognizant.agrilink.input.dto.CatalogDto;
import com.cognizant.agrilink.input.dto.MessageResponse;
import com.cognizant.agrilink.input.entity.Catalog;
import com.cognizant.agrilink.input.service.CatalogService;
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
@RequestMapping("/catalogs")
public class CatalogController {

	private final CatalogService catalogService;

	public CatalogController(CatalogService catalogService) {
		this.catalogService = catalogService;
	}

	// GET methods return full data
	@GetMapping
	public ResponseEntity<List<Catalog>> getAll() {
		return ResponseEntity.ok(catalogService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<Catalog> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(catalogService.getById(id));
	}

	// Non-GET methods return only a message
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody CatalogDto dto) {
		catalogService.create(dto);
		return ResponseEntity.ok(new MessageResponse("Catalog created successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody CatalogDto dto) {
		catalogService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("Catalog updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id) {
		catalogService.delete(id);
		return ResponseEntity.ok(new MessageResponse("Catalog deleted successfully"));
	}
}

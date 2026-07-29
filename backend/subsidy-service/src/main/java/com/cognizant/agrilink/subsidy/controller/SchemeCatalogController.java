package com.cognizant.agrilink.subsidy.controller;

import com.cognizant.agrilink.subsidy.dto.MessageResponse;
import com.cognizant.agrilink.subsidy.dto.SchemeCatalogDto;
import com.cognizant.agrilink.subsidy.entity.SchemeCatalog;
import com.cognizant.agrilink.subsidy.service.SchemeCatalogService;
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
@RequestMapping("/agriLink/subsidyScheme")
@lombok.extern.slf4j.Slf4j
public class SchemeCatalogController {

	private final SchemeCatalogService schemeCatalogService;

	public SchemeCatalogController(SchemeCatalogService schemeCatalogService) {
		this.schemeCatalogService = schemeCatalogService;
	}

	// GET methods return full data
	@GetMapping("/fetchSchemes")
	public ResponseEntity<List<SchemeCatalog>> getAll() {
		log.info("Fetching all subsidy schemes");
		return ResponseEntity.ok(schemeCatalogService.getAll());
	}

	@GetMapping("/fetchSchemeById/{schemeId}")
	public ResponseEntity<SchemeCatalog> getById(@PathVariable Integer schemeId) {
		return ResponseEntity.ok(schemeCatalogService.getById(schemeId));
	}

	// Non-GET methods return only a message
	@PostMapping("/createScheme")
	public ResponseEntity<MessageResponse> create(@RequestBody SchemeCatalogDto dto) {
		log.info("Creating a new scheme with name: {}", dto.getSchemeName());
		schemeCatalogService.create(dto);
		return ResponseEntity.ok(new MessageResponse("Scheme created successfully"));
	}

	@PutMapping("/updateScheme/{schemeId}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer schemeId,
			@RequestBody SchemeCatalogDto dto) {
		schemeCatalogService.update(schemeId, dto);
		return ResponseEntity.ok(new MessageResponse("Scheme updated successfully"));
	}

	@PutMapping("/updateSchemeStatus/{schemeId}")
	public ResponseEntity<MessageResponse> updateStatus(@PathVariable Integer schemeId,
			@RequestBody SchemeCatalogDto dto) {
		schemeCatalogService.updateStatus(schemeId, dto.getStatus());
		return ResponseEntity.ok(new MessageResponse("Status updated successfully"));
	}

	@DeleteMapping("/deleteScheme/{schemeId}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer schemeId) {
		schemeCatalogService.delete(schemeId);
		return ResponseEntity.ok(new MessageResponse("Scheme deleted successfully"));
	}
}

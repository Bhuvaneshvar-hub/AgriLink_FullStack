package com.cognizant.agrilink.crop.controller;

import com.cognizant.agrilink.crop.dto.GrowthObservationDto;
import com.cognizant.agrilink.crop.dto.MessageResponse;
import com.cognizant.agrilink.crop.entity.GrowthObservation;
import com.cognizant.agrilink.crop.service.GrowthObservationService;
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
@RequestMapping("/growth-observations")
public class GrowthObservationController {

	private final GrowthObservationService growthObservationService;

	public GrowthObservationController(GrowthObservationService growthObservationService) {
		this.growthObservationService = growthObservationService;
	}

	// GET methods return full data
	@GetMapping
	public ResponseEntity<List<GrowthObservation>> getAll() {
		return ResponseEntity.ok(growthObservationService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<GrowthObservation> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(growthObservationService.getById(id));
	}

	// Non-GET methods return only a message
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody GrowthObservationDto dto) {
		growthObservationService.create(dto);
		return ResponseEntity.ok(new MessageResponse("GrowthObservation created successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody GrowthObservationDto dto) {
		growthObservationService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("GrowthObservation updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id) {
		growthObservationService.delete(id);
		return ResponseEntity.ok(new MessageResponse("GrowthObservation deleted successfully"));
	}
}

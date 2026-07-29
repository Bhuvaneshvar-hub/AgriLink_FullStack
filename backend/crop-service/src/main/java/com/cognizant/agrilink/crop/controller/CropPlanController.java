package com.cognizant.agrilink.crop.controller;

import com.cognizant.agrilink.crop.dto.CropPlanDto;
import com.cognizant.agrilink.crop.dto.MessageResponse;
import com.cognizant.agrilink.crop.entity.CropPlan;
import com.cognizant.agrilink.crop.service.CropPlanService;
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
@RequestMapping("/crop-plans")
public class CropPlanController {

	private final CropPlanService cropPlanService;

	public CropPlanController(CropPlanService cropPlanService) {
		this.cropPlanService = cropPlanService;
	}

	// GET methods return full data
	@GetMapping
	public ResponseEntity<List<CropPlan>> getAll() {
		return ResponseEntity.ok(cropPlanService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<CropPlan> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(cropPlanService.getById(id));
	}

	// Non-GET methods return only a message
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody CropPlanDto dto) {
		cropPlanService.create(dto);
		return ResponseEntity.ok(new MessageResponse("CropPlan created successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody CropPlanDto dto) {
		cropPlanService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("CropPlan updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id) {
		cropPlanService.delete(id);
		return ResponseEntity.ok(new MessageResponse("CropPlan deleted successfully"));
	}
}

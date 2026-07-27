package com.cognizant.agrilink.produce.controller;

import com.cognizant.agrilink.produce.dto.MessageResponse;
import com.cognizant.agrilink.produce.dto.ProduceListingDto;
import com.cognizant.agrilink.produce.entity.ProduceListing;
import com.cognizant.agrilink.produce.service.ProduceListingService;
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
@RequestMapping("/produce-listings")
public class ProduceListingController {

	private final ProduceListingService produceListingService;

	public ProduceListingController(ProduceListingService produceListingService) {
		this.produceListingService = produceListingService;
	}

	// GET methods return full data
	@GetMapping
	public ResponseEntity<List<ProduceListing>> getAll() {
		return ResponseEntity.ok(produceListingService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<ProduceListing> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(produceListingService.getById(id));
	}

	// Non-GET methods return only a message
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody ProduceListingDto dto) {
		produceListingService.create(dto);
		return ResponseEntity.ok(new MessageResponse("ProduceListing created successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody ProduceListingDto dto) {
		produceListingService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("ProduceListing updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id) {
		produceListingService.delete(id);
		return ResponseEntity.ok(new MessageResponse("ProduceListing deleted successfully"));
	}
}

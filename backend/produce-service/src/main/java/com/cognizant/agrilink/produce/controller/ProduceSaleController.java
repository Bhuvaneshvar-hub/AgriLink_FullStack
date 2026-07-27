package com.cognizant.agrilink.produce.controller;

import com.cognizant.agrilink.produce.dto.MessageResponse;
import com.cognizant.agrilink.produce.dto.ProduceSaleDto;
import com.cognizant.agrilink.produce.entity.ProduceSale;
import com.cognizant.agrilink.produce.service.ProduceSaleService;
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
@RequestMapping("/produce-sales")
public class ProduceSaleController {

	private final ProduceSaleService produceSaleService;

	public ProduceSaleController(ProduceSaleService produceSaleService) {
		this.produceSaleService = produceSaleService;
	}

	// GET methods return full data
	@GetMapping
	public ResponseEntity<List<ProduceSale>> getAll() {
		return ResponseEntity.ok(produceSaleService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<ProduceSale> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(produceSaleService.getById(id));
	}

	// Non-GET methods return only a message
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody ProduceSaleDto dto) {
		produceSaleService.create(dto);
		return ResponseEntity.ok(new MessageResponse("ProduceSale created successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody ProduceSaleDto dto) {
		produceSaleService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("ProduceSale updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id) {
		produceSaleService.delete(id);
		return ResponseEntity.ok(new MessageResponse("ProduceSale deleted successfully"));
	}
}

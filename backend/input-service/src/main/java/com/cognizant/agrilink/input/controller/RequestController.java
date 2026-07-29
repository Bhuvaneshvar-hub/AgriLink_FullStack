package com.cognizant.agrilink.input.controller;

import com.cognizant.agrilink.input.dto.MessageResponse;
import com.cognizant.agrilink.input.dto.RequestDto;
import com.cognizant.agrilink.input.entity.Request;
import com.cognizant.agrilink.input.service.RequestService;
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
@RequestMapping("/requests")
public class RequestController {

	private final RequestService requestService;

	public RequestController(RequestService requestService) {
		this.requestService = requestService;
	}

	// GET methods return full data
	@GetMapping
	public ResponseEntity<List<Request>> getAll() {
		return ResponseEntity.ok(requestService.getAll());
	}

	@GetMapping("/{id}")
	public ResponseEntity<Request> getById(@PathVariable Integer id) {
		return ResponseEntity.ok(requestService.getById(id));
	}

	// Non-GET methods return only a message
	@PostMapping
	public ResponseEntity<MessageResponse> create(@RequestBody RequestDto dto) {
		requestService.create(dto);
		return ResponseEntity.ok(new MessageResponse("Request created successfully"));
	}

	@PutMapping("/{id}")
	public ResponseEntity<MessageResponse> update(@PathVariable Integer id, @RequestBody RequestDto dto) {
		requestService.update(id, dto);
		return ResponseEntity.ok(new MessageResponse("Request updated successfully"));
	}

	@DeleteMapping("/{id}")
	public ResponseEntity<MessageResponse> delete(@PathVariable Integer id) {
		requestService.delete(id);
		return ResponseEntity.ok(new MessageResponse("Request deleted successfully"));
	}
}

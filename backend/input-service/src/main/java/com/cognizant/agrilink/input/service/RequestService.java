package com.cognizant.agrilink.input.service;

import com.cognizant.agrilink.input.dto.RequestDto;
import com.cognizant.agrilink.input.entity.Catalog;
import com.cognizant.agrilink.input.entity.Request;
import com.cognizant.agrilink.input.enums.RequestStatus;
import com.cognizant.agrilink.input.repository.CatalogRepository;
import com.cognizant.agrilink.input.repository.RequestRepository;
import com.cognizant.agrilink.input.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RequestService {

	private final RequestRepository requestRepository;
	private final CatalogRepository catalogRepository;

	public RequestService(RequestRepository requestRepository, CatalogRepository catalogRepository) {
		this.requestRepository = requestRepository;
		this.catalogRepository = catalogRepository;
	}

	public List<Request> getAll() {
		return requestRepository.findAll();
	}

	public Request getById(Integer id) {
		return requestRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("Request not found with id " + id));
	}

	public Request create(RequestDto dto) {
		Request request = Request.builder()
				.farmerId(dto.getFarmerId())
				.inputId(dto.getInputId())
				.quantityRequested(dto.getQuantityRequested())
				.requestDate(dto.getRequestDate())
				.assignedCentreId(dto.getAssignedCentreId())
				.actualPrice(dto.getActualPrice())
				.status(dto.getStatus() != null ? dto.getStatus() : RequestStatus.PE)
				.build();
		return requestRepository.save(request);
	}

	public Request update(Integer id, RequestDto dto) {
		Request request = getById(id);
		RequestStatus previousStatus = request.getStatus();
		RequestStatus newStatus = dto.getStatus();

		// Deduct stock when status changes PE -> AP (Approved)
		if (previousStatus == RequestStatus.PE && newStatus == RequestStatus.AP) {
			Catalog catalog = catalogRepository.findById(request.getInputId())
					.orElseThrow(() -> new ResourceNotFoundException("Catalog not found with id " + request.getInputId()));
			if (catalog.getAvailableStock() < request.getQuantityRequested()) {
				throw new IllegalStateException("Insufficient stock. Available: " + catalog.getAvailableStock()
						+ ", Requested: " + request.getQuantityRequested());
			}
			catalog.setAvailableStock(catalog.getAvailableStock() - request.getQuantityRequested());
			catalogRepository.save(catalog);
		}

		// Restore stock when status changes AP -> RE (Rejected after approval)
		if (previousStatus == RequestStatus.AP && newStatus == RequestStatus.RE) {
			Catalog catalog = catalogRepository.findById(request.getInputId())
					.orElseThrow(() -> new ResourceNotFoundException("Catalog not found with id " + request.getInputId()));
			catalog.setAvailableStock(catalog.getAvailableStock() + request.getQuantityRequested());
			catalogRepository.save(catalog);
		}

		request.setFarmerId(dto.getFarmerId());
		request.setInputId(dto.getInputId());
		request.setQuantityRequested(dto.getQuantityRequested());
		request.setRequestDate(dto.getRequestDate());
		request.setAssignedCentreId(dto.getAssignedCentreId());
		request.setActualPrice(dto.getActualPrice());
		request.setStatus(newStatus);
		return requestRepository.save(request);
	}

	public void delete(Integer id) {
		Request request = getById(id);
		requestRepository.delete(request);
	}
}

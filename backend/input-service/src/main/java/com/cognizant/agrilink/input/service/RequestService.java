package com.cognizant.agrilink.input.service;

import com.cognizant.agrilink.input.dto.RequestDto;
import com.cognizant.agrilink.input.entity.Request;
import com.cognizant.agrilink.input.enums.RequestStatus;
import com.cognizant.agrilink.input.repository.RequestRepository;
import com.cognizant.agrilink.input.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class RequestService {

	private final RequestRepository requestRepository;

	public RequestService(RequestRepository requestRepository) {
		this.requestRepository = requestRepository;
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
		request.setFarmerId(dto.getFarmerId());
		request.setInputId(dto.getInputId());
		request.setQuantityRequested(dto.getQuantityRequested());
		request.setRequestDate(dto.getRequestDate());
		request.setAssignedCentreId(dto.getAssignedCentreId());
		request.setActualPrice(dto.getActualPrice());
		request.setStatus(dto.getStatus());
		return requestRepository.save(request);
	}

	public void delete(Integer id) {
		Request request = getById(id);
		requestRepository.delete(request);
	}
}

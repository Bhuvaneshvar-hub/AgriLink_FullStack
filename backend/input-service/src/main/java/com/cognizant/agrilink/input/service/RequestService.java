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
import org.springframework.transaction.annotation.Transactional;

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

	@Transactional
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
		if (holdsStock(request.getStatus())) {
			reserveStock(request.getInputId(), request.getQuantityRequested());
		}
		return requestRepository.save(request);
	}

	@Transactional
	public Request update(Integer id, RequestDto dto) {
		Request request = getById(id);
		RequestStatus previousStatus = request.getStatus();
		Integer previousInputId = request.getInputId();
		Integer previousQuantity = request.getQuantityRequested();

		request.setFarmerId(dto.getFarmerId());
		request.setInputId(dto.getInputId());
		request.setQuantityRequested(dto.getQuantityRequested());
		request.setRequestDate(dto.getRequestDate());
		request.setAssignedCentreId(dto.getAssignedCentreId());
		request.setActualPrice(dto.getActualPrice());
		request.setStatus(dto.getStatus());

		// Approval takes the requested quantity out of the catalog; moving back out of
		// an approved state puts it back. Releasing the old claim before taking the new
		// one keeps an already-approved request from being deducted twice (e.g. AP -> DL)
		// and keeps the stock correct if the item or quantity is edited at the same time.
		if (holdsStock(previousStatus)) {
			releaseStock(previousInputId, previousQuantity);
		}
		if (holdsStock(request.getStatus())) {
			reserveStock(request.getInputId(), request.getQuantityRequested());
		}
		return requestRepository.save(request);
	}

	@Transactional
	public void delete(Integer id) {
		Request request = getById(id);
		if (holdsStock(request.getStatus())) {
			releaseStock(request.getInputId(), request.getQuantityRequested());
		}
		requestRepository.delete(request);
	}

	/** Approved and delivered requests own their quantity; pending/rejected ones do not. */
	private static boolean holdsStock(RequestStatus status) {
		return status == RequestStatus.AP || status == RequestStatus.DL;
	}

	private void reserveStock(Integer inputId, Integer quantity) {
		int qty = quantity != null ? quantity : 0;
		if (inputId == null || qty <= 0) {
			return;
		}
		Catalog catalog = findCatalog(inputId);
		int stock = catalog.getAvailableStock() != null ? catalog.getAvailableStock() : 0;
		if (qty > stock) {
			throw new IllegalStateException("Insufficient stock for " + catalog.getName()
					+ ": " + stock + " available, " + qty + " requested");
		}
		catalog.setAvailableStock(stock - qty);
		catalogRepository.save(catalog);
	}

	private void releaseStock(Integer inputId, Integer quantity) {
		int qty = quantity != null ? quantity : 0;
		if (inputId == null || qty <= 0) {
			return;
		}
		Catalog catalog = findCatalog(inputId);
		int stock = catalog.getAvailableStock() != null ? catalog.getAvailableStock() : 0;
		catalog.setAvailableStock(stock + qty);
		catalogRepository.save(catalog);
	}

	private Catalog findCatalog(Integer inputId) {
		return catalogRepository.findById(inputId)
				.orElseThrow(() -> new ResourceNotFoundException("Catalog not found with id " + inputId));
	}
}

package com.cognizant.agrilink.input.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.cognizant.agrilink.input.dto.RequestDto;
import com.cognizant.agrilink.input.entity.Catalog;
import com.cognizant.agrilink.input.entity.Request;
import com.cognizant.agrilink.input.enums.RequestStatus;
import com.cognizant.agrilink.input.enums.Status;
import com.cognizant.agrilink.input.repository.CatalogRepository;
import com.cognizant.agrilink.input.repository.RequestRepository;
import jakarta.persistence.EntityManager;
import java.time.LocalDate;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;
import org.springframework.context.annotation.Import;

/**
 * Verifies the "approval decreases available stock" rule against a real database
 * rather than mocked repositories, so the deduction is proven to be persisted and
 * not just applied to an in-memory entity.
 *
 * <p>Each assertion flushes and clears the persistence context first, forcing the
 * follow-up read to come back from the database.</p>
 */
@DataJpaTest
@Import(RequestService.class)
class RequestApprovalStockIntegrationTest {

	@Autowired
	private RequestService requestService;

	@Autowired
	private RequestRepository requestRepository;

	@Autowired
	private CatalogRepository catalogRepository;

	@Autowired
	private EntityManager entityManager;

	private Catalog urea;

	@BeforeEach
	void seedCatalog() {
		urea = catalogRepository.save(Catalog.builder()
				.name("Organic Urea Fertilizer")
				.category("Fertilizer")
				.unit("Kg")
				.pricePerUnit(30.0)
				.subsidisedPrice(18.0)
				.availableStock(200)
				.status(Status.AC)
				.build());
	}

	/** Persists a pending farmer request for the seeded catalog item. */
	private Request pendingRequest(int quantity) {
		return requestRepository.save(Request.builder()
				.farmerId(1)
				.inputId(urea.getInputId())
				.quantityRequested(quantity)
				.requestDate(LocalDate.of(2026, 8, 5))
				.assignedCentreId(101)
				.actualPrice(quantity * 18.0)
				.status(RequestStatus.PE)
				.build());
	}

	/** Mirrors the payload the frontend PUTs when the officer clicks Approve. */
	private RequestDto asDto(Request request, RequestStatus newStatus) {
		return RequestDto.builder()
				.requestId(request.getRequestId())
				.farmerId(request.getFarmerId())
				.inputId(request.getInputId())
				.quantityRequested(request.getQuantityRequested())
				.requestDate(request.getRequestDate())
				.assignedCentreId(request.getAssignedCentreId())
				.actualPrice(request.getActualPrice())
				.status(newStatus)
				.build();
	}

	private int stockFromDatabase() {
		entityManager.flush();
		entityManager.clear();
		return catalogRepository.findById(urea.getInputId()).orElseThrow().getAvailableStock();
	}

	@Test
	void approvalPersistsTheReducedStock() {
		Request request = pendingRequest(50);
		assertThat(stockFromDatabase()).isEqualTo(200);

		requestService.update(request.getRequestId(), asDto(request, RequestStatus.AP));

		assertThat(stockFromDatabase()).isEqualTo(150);
		assertThat(requestRepository.findById(request.getRequestId()).orElseThrow().getStatus())
				.isEqualTo(RequestStatus.AP);
	}

	@Test
	void approvalsAccumulateAcrossFarmerRequests() {
		Request first = pendingRequest(50);
		Request second = pendingRequest(30);

		requestService.update(first.getRequestId(), asDto(first, RequestStatus.AP));
		requestService.update(second.getRequestId(), asDto(second, RequestStatus.AP));

		assertThat(stockFromDatabase()).isEqualTo(120);
	}

	@Test
	void deliveryAfterApprovalLeavesStockUnchanged() {
		Request request = pendingRequest(50);
		requestService.update(request.getRequestId(), asDto(request, RequestStatus.AP));
		assertThat(stockFromDatabase()).isEqualTo(150);

		Request approved = requestRepository.findById(request.getRequestId()).orElseThrow();
		requestService.update(approved.getRequestId(), asDto(approved, RequestStatus.DL));

		assertThat(stockFromDatabase()).isEqualTo(150);
	}

	@Test
	void rejectionLeavesStockUntouched() {
		Request request = pendingRequest(50);

		requestService.update(request.getRequestId(), asDto(request, RequestStatus.RE));

		assertThat(stockFromDatabase()).isEqualTo(200);
	}

	@Test
	void approvalIsRefusedWhenStockIsShort() {
		Request request = pendingRequest(250);

		assertThatThrownBy(() -> requestService.update(request.getRequestId(),
				asDto(request, RequestStatus.AP)))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("Insufficient stock");

		assertThat(stockFromDatabase()).isEqualTo(200);
	}

	@Test
	void stockCanBeDrawnDownToExactlyZero() {
		Request request = pendingRequest(200);

		requestService.update(request.getRequestId(), asDto(request, RequestStatus.AP));

		assertThat(stockFromDatabase()).isZero();
	}
}

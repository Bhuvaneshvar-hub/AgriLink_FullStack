package com.cognizant.agrilink.input.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.input.dto.RequestDto;
import com.cognizant.agrilink.input.entity.Catalog;
import com.cognizant.agrilink.input.entity.Request;
import com.cognizant.agrilink.input.enums.RequestStatus;
import com.cognizant.agrilink.input.repository.CatalogRepository;
import com.cognizant.agrilink.input.repository.RequestRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RequestServiceTest {

	@Mock
	private RequestRepository requestRepository;

	@Mock
	private CatalogRepository catalogRepository;

	@InjectMocks
	private RequestService requestService;

	private Request request;
	private RequestDto dto;

	@BeforeEach
	void setUp() {
		request = Request.builder()
				.requestId(1)
				.farmerId(1)
				.inputId(10)
				.quantityRequested(50)
				.requestDate(LocalDate.of(2026, 6, 15))
				.assignedCentreId(5)
				.actualPrice(1500.0)
				.status(RequestStatus.PE)
				.build();
		dto = RequestDto.builder()
				.farmerId(1)
				.inputId(10)
				.quantityRequested(50)
				.requestDate(LocalDate.of(2026, 6, 15))
				.assignedCentreId(5)
				.actualPrice(1500.0)
				.status(RequestStatus.PE)
				.build();
	}

	@Test
	void getAllReturnsList() {
		when(requestRepository.findAll()).thenReturn(List.of(request));

		assertThat(requestService.getAll()).hasSize(1);
		verify(requestRepository).findAll();
	}

	@Test
	void getByIdReturnsRecord() {
		when(requestRepository.findById(1)).thenReturn(Optional.of(request));

		assertThat(requestService.getById(1).getStatus()).isEqualTo(RequestStatus.PE);
	}

	@Test
	void getByIdThrowsWhenMissing() {
		when(requestRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> requestService.getById(99))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@Test
	void createSavesRecord() {
		// A pending request deducts nothing, but its quantity is still checked against
		// the catalog, so the lookup has to be stubbed even for the plain-save case.
		Catalog catalog = Catalog.builder().inputId(10).name("Urea").availableStock(200).build();
		when(catalogRepository.findById(10)).thenReturn(Optional.of(catalog));
		when(requestRepository.save(any(Request.class))).thenReturn(request);

		requestService.create(dto);

		verify(requestRepository).save(any(Request.class));
		assertThat(catalog.getAvailableStock()).isEqualTo(200);
	}

	@Test
	void creatingPendingRequestBeyondStockIsRejected() {
		Catalog catalog = Catalog.builder().inputId(10).name("Urea").availableStock(20).build();
		when(catalogRepository.findById(10)).thenReturn(Optional.of(catalog));

		// dto asks for 50 against 20 in stock, as PE.
		assertThatThrownBy(() -> requestService.create(dto))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("Insufficient stock");
		assertThat(catalog.getAvailableStock()).isEqualTo(20);
		verify(requestRepository, never()).save(any(Request.class));
	}

	@Test
	void creatingPendingRequestDoesNotDeductStock() {
		Catalog catalog = Catalog.builder().inputId(10).name("Urea").availableStock(200).build();
		when(catalogRepository.findById(10)).thenReturn(Optional.of(catalog));
		when(requestRepository.save(any(Request.class))).thenReturn(request);

		requestService.create(dto);

		// Stock only moves on approval, so the catalog must be left alone here.
		assertThat(catalog.getAvailableStock()).isEqualTo(200);
		verify(catalogRepository, never()).save(any(Catalog.class));
	}

	@Test
	void updateModifiesRecord() {
		when(requestRepository.findById(1)).thenReturn(Optional.of(request));
		when(requestRepository.save(any(Request.class))).thenReturn(request);

		requestService.update(1, dto);

		verify(requestRepository).save(any(Request.class));
	}

	@Test
	void deleteRemovesRecord() {
		when(requestRepository.findById(1)).thenReturn(Optional.of(request));

		requestService.delete(1);

		verify(requestRepository, times(1)).delete(request);
	}

	@Test
	void approvingRequestDecreasesCatalogStock() {
		Catalog catalog = Catalog.builder().inputId(10).name("Urea").availableStock(200).build();
		when(requestRepository.findById(1)).thenReturn(Optional.of(request));
		when(requestRepository.save(any(Request.class))).thenReturn(request);
		when(catalogRepository.findById(10)).thenReturn(Optional.of(catalog));
		dto.setStatus(RequestStatus.AP);

		requestService.update(1, dto);

		assertThat(catalog.getAvailableStock()).isEqualTo(150);
		verify(catalogRepository).save(catalog);
	}

	@Test
	void approvingMoreThanAvailableStockIsRejected() {
		Catalog catalog = Catalog.builder().inputId(10).name("Urea").availableStock(20).build();
		when(requestRepository.findById(1)).thenReturn(Optional.of(request));
		when(catalogRepository.findById(10)).thenReturn(Optional.of(catalog));
		dto.setStatus(RequestStatus.AP);

		assertThatThrownBy(() -> requestService.update(1, dto))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("Insufficient stock");
		assertThat(catalog.getAvailableStock()).isEqualTo(20);
	}

	@Test
	void markingApprovedRequestDeliveredDoesNotDeductTwice() {
		request.setStatus(RequestStatus.AP);
		Catalog catalog = Catalog.builder().inputId(10).name("Urea").availableStock(150).build();
		when(requestRepository.findById(1)).thenReturn(Optional.of(request));
		when(requestRepository.save(any(Request.class))).thenReturn(request);
		when(catalogRepository.findById(10)).thenReturn(Optional.of(catalog));
		dto.setStatus(RequestStatus.DL);

		requestService.update(1, dto);

		assertThat(catalog.getAvailableStock()).isEqualTo(150);
	}

	@Test
	void rejectingApprovedRequestReturnsStock() {
		request.setStatus(RequestStatus.AP);
		Catalog catalog = Catalog.builder().inputId(10).name("Urea").availableStock(150).build();
		when(requestRepository.findById(1)).thenReturn(Optional.of(request));
		when(requestRepository.save(any(Request.class))).thenReturn(request);
		when(catalogRepository.findById(10)).thenReturn(Optional.of(catalog));
		dto.setStatus(RequestStatus.RE);

		requestService.update(1, dto);

		assertThat(catalog.getAvailableStock()).isEqualTo(200);
	}

	@Test
	void deletingApprovedRequestReturnsStock() {
		request.setStatus(RequestStatus.AP);
		Catalog catalog = Catalog.builder().inputId(10).name("Urea").availableStock(150).build();
		when(requestRepository.findById(1)).thenReturn(Optional.of(request));
		when(catalogRepository.findById(10)).thenReturn(Optional.of(catalog));

		requestService.delete(1);

		assertThat(catalog.getAvailableStock()).isEqualTo(200);
		verify(requestRepository, times(1)).delete(request);
	}
}

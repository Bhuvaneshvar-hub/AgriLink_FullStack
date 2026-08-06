package com.cognizant.agrilink.input.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.lenient;
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
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RequestServiceExtendedTest {

	@Mock
	private RequestRepository requestRepository;

	@Mock
	private CatalogRepository catalogRepository;

	@InjectMocks
	private RequestService requestService;

	/**
	 * Approved/delivered requests deduct from catalog stock, so any case here that
	 * touches those statuses needs a catalog to draw from. Stock is deliberately far
	 * larger than the quantities used below — the stock arithmetic itself is asserted
	 * in {@code RequestServiceTest}.
	 */
	@BeforeEach
	void stubCatalogLookup() {
		lenient().when(catalogRepository.findById(anyInt()))
				.thenAnswer(invocation -> Optional.of(Catalog.builder()
						.inputId(invocation.getArgument(0))
						.name("Stub Supply")
						.availableStock(1_000_000)
						.build()));
	}

	private RequestDto buildDto() {
		return RequestDto.builder()
				.farmerId(1)
				.inputId(10)
				.quantityRequested(50)
				.requestDate(LocalDate.of(2026, 6, 15))
				.assignedCentreId(5)
				.actualPrice(1500.0)
				.status(RequestStatus.PE)
				.build();
	}

	@ParameterizedTest
	@EnumSource(RequestStatus.class)
	void createPropagatesStatus(RequestStatus status) {
		RequestDto dto = buildDto();
		dto.setStatus(status);
		when(requestRepository.save(any(Request.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Request> captor = ArgumentCaptor.forClass(Request.class);
		requestService.create(dto);

		verify(requestRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 10, 100, 5000, 1000000})
	void createPropagatesFarmerId(int farmerId) {
		RequestDto dto = buildDto();
		dto.setFarmerId(farmerId);
		when(requestRepository.save(any(Request.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Request> captor = ArgumentCaptor.forClass(Request.class);
		requestService.create(dto);

		verify(requestRepository).save(captor.capture());
		assertThat(captor.getValue().getFarmerId()).isEqualTo(farmerId);
	}

	@ParameterizedTest
	@ValueSource(ints = {0, 1, 50, 999, 100000})
	void createPropagatesQuantity(int quantity) {
		RequestDto dto = buildDto();
		dto.setQuantityRequested(quantity);
		when(requestRepository.save(any(Request.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Request> captor = ArgumentCaptor.forClass(Request.class);
		requestService.create(dto);

		verify(requestRepository).save(captor.capture());
		assertThat(captor.getValue().getQuantityRequested()).isEqualTo(quantity);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.01, 150.0, 9999.99, 1000000.0})
	void createPropagatesPrice(double price) {
		RequestDto dto = buildDto();
		dto.setActualPrice(price);
		when(requestRepository.save(any(Request.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Request> captor = ArgumentCaptor.forClass(Request.class);
		requestService.create(dto);

		verify(requestRepository).save(captor.capture());
		assertThat(captor.getValue().getActualPrice()).isEqualTo(price);
	}

	@ParameterizedTest
	@CsvSource({
			"2020-01-01",
			"2024-02-29",
			"2026-06-15",
			"2030-12-31"
	})
	void createPropagatesDate(String date) {
		LocalDate requestDate = LocalDate.parse(date);
		RequestDto dto = buildDto();
		dto.setRequestDate(requestDate);
		when(requestRepository.save(any(Request.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Request> captor = ArgumentCaptor.forClass(Request.class);
		requestService.create(dto);

		verify(requestRepository).save(captor.capture());
		assertThat(captor.getValue().getRequestDate()).isEqualTo(requestDate);
	}

	@ParameterizedTest
	@CsvSource({
			"1,10,50,PE",
			"2,20,75,AP",
			"3,30,100,AP",
			"4,40,5,RE"
	})
	void createPropagatesCombination(int farmerId, int inputId, int quantity, RequestStatus status) {
		RequestDto dto = buildDto();
		dto.setFarmerId(farmerId);
		dto.setInputId(inputId);
		dto.setQuantityRequested(quantity);
		dto.setStatus(status);
		when(requestRepository.save(any(Request.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Request> captor = ArgumentCaptor.forClass(Request.class);
		requestService.create(dto);

		verify(requestRepository).save(captor.capture());
		Request captured = captor.getValue();
		assertThat(captured.getFarmerId()).isEqualTo(farmerId);
		assertThat(captured.getInputId()).isEqualTo(inputId);
		assertThat(captured.getQuantityRequested()).isEqualTo(quantity);
		assertThat(captured.getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 50, 999, 100000})
	void getByIdLooksUpVariousIds(int id) {
		Request request = Request.builder().requestId(id).status(RequestStatus.PE).build();
		when(requestRepository.findById(id)).thenReturn(Optional.of(request));

		assertThat(requestService.getById(id).getRequestId()).isEqualTo(id);
		verify(requestRepository).findById(id);
	}

	@ParameterizedTest
	@ValueSource(ints = {99, 100, 500, 9999})
	void getByIdThrowsForVariousMissingIds(int id) {
		when(requestRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> requestService.getById(id))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessageContaining(String.valueOf(id));
	}

	@Test
	void getAllReturnsEmptyList() {
		when(requestRepository.findAll()).thenReturn(new ArrayList<>());

		assertThat(requestService.getAll()).isEmpty();
		verify(requestRepository).findAll();
	}

	@Test
	void getAllReturnsManyRecords() {
		List<Request> many = List.of(
				Request.builder().requestId(1).build(),
				Request.builder().requestId(2).build(),
				Request.builder().requestId(3).build(),
				Request.builder().requestId(4).build());
		when(requestRepository.findAll()).thenReturn(many);

		assertThat(requestService.getAll()).hasSize(4);
	}

	@Test
	void updateModifiesEachField() {
		Request existing = Request.builder().requestId(1).inputId(10).quantityRequested(50).status(RequestStatus.PE).build();
		when(requestRepository.findById(1)).thenReturn(Optional.of(existing));
		when(requestRepository.save(any(Request.class))).thenAnswer(i -> i.getArgument(0));
		Catalog catalog = Catalog.builder().inputId(10).availableStock(100).build();
		when(catalogRepository.findById(10)).thenReturn(Optional.of(catalog));

		RequestDto dto = buildDto();
		dto.setStatus(RequestStatus.AP);
		requestService.update(1, dto);

		ArgumentCaptor<Request> captor = ArgumentCaptor.forClass(Request.class);
		verify(requestRepository).save(captor.capture());
		Request saved = captor.getValue();
		assertThat(saved.getFarmerId()).isEqualTo(1);
		assertThat(saved.getInputId()).isEqualTo(10);
		assertThat(saved.getQuantityRequested()).isEqualTo(50);
		assertThat(saved.getRequestDate()).isEqualTo(LocalDate.of(2026, 6, 15));
		assertThat(saved.getAssignedCentreId()).isEqualTo(5);
		assertThat(saved.getActualPrice()).isEqualTo(1500.0);
		assertThat(saved.getStatus()).isEqualTo(RequestStatus.AP);
	}

	@Test
	void updateThrowsWhenMissing() {
		when(requestRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> requestService.update(99, buildDto()))
				.isInstanceOf(EntityNotFoundException.class);
		verify(requestRepository, never()).save(any(Request.class));
	}

	@Test
	void updateRetainsId() {
		Request existing = Request.builder().requestId(7).build();
		when(requestRepository.findById(7)).thenReturn(Optional.of(existing));
		when(requestRepository.save(any(Request.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Request> captor = ArgumentCaptor.forClass(Request.class);
		requestService.update(7, buildDto());

		verify(requestRepository).save(captor.capture());
		assertThat(captor.getValue().getRequestId()).isEqualTo(7);
	}

	@Test
	void deleteThrowsWhenMissing() {
		when(requestRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> requestService.delete(99))
				.isInstanceOf(EntityNotFoundException.class);
		verify(requestRepository, never()).delete(any(Request.class));
	}

	@Test
	void deleteInvokesRepositoryOnce() {
		Request existing = Request.builder().requestId(1).build();
		when(requestRepository.findById(1)).thenReturn(Optional.of(existing));

		requestService.delete(1);

		verify(requestRepository, times(1)).delete(existing);
	}

	@Test
	void createReturnsSavedEntity() {
		Request saved = Request.builder().requestId(5).status(RequestStatus.PE).build();
		when(requestRepository.save(any(Request.class))).thenReturn(saved);

		assertThat(requestService.create(buildDto()).getRequestId()).isEqualTo(5);
	}

	@Test
	void createNeverSetsId() {
		when(requestRepository.save(any(Request.class))).thenAnswer(i -> i.getArgument(0));

		ArgumentCaptor<Request> captor = ArgumentCaptor.forClass(Request.class);
		requestService.create(buildDto());

		verify(requestRepository).save(captor.capture());
		assertThat(captor.getValue().getRequestId()).isNull();
	}
}

package com.cognizant.agrilink.input.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.input.dto.RequestDto;
import com.cognizant.agrilink.input.entity.Request;
import com.cognizant.agrilink.input.enums.RequestStatus;
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
		when(requestRepository.save(any(Request.class))).thenReturn(request);

		requestService.create(dto);

		verify(requestRepository).save(any(Request.class));
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
}

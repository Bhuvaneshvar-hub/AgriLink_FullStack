package com.cognizant.agrilink.input.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.input.entity.Request;
import com.cognizant.agrilink.input.enums.RequestStatus;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class RequestRepositoryTest {

	@Autowired
	private RequestRepository requestRepository;

	private Request buildRequest() {
		return Request.builder()
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
	void saveAndFindById() {
		Request saved = requestRepository.save(buildRequest());

		Request found = requestRepository.findById(saved.getRequestId()).orElseThrow();

		assertThat(found.getQuantityRequested()).isEqualTo(50);
		assertThat(found.getStatus()).isEqualTo(RequestStatus.PE);
	}

	@Test
	void findAllReturnsSavedRecords() {
		requestRepository.save(buildRequest());
		requestRepository.save(buildRequest());

		assertThat(requestRepository.findAll()).hasSize(2);
	}

	@Test
	void deleteRemovesRecord() {
		Request saved = requestRepository.save(buildRequest());

		requestRepository.deleteById(saved.getRequestId());

		assertThat(requestRepository.findById(saved.getRequestId())).isEmpty();
	}
}

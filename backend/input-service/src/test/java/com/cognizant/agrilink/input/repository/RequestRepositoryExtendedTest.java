package com.cognizant.agrilink.input.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.input.entity.Request;
import com.cognizant.agrilink.input.enums.RequestStatus;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class RequestRepositoryExtendedTest {

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

	@ParameterizedTest
	@EnumSource(RequestStatus.class)
	void saveWithVariousStatuses(RequestStatus status) {
		Request request = buildRequest();
		request.setStatus(status);

		Request saved = requestRepository.save(request);

		assertThat(requestRepository.findById(saved.getRequestId()).orElseThrow().getStatus())
				.isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 10, 100, 5000, 1000000})
	void saveWithVariousFarmerIds(int farmerId) {
		Request request = buildRequest();
		request.setFarmerId(farmerId);

		Request saved = requestRepository.save(request);

		assertThat(requestRepository.findById(saved.getRequestId()).orElseThrow().getFarmerId())
				.isEqualTo(farmerId);
	}

	@ParameterizedTest
	@ValueSource(ints = {0, 1, 50, 999, 100000})
	void saveWithBoundaryQuantities(int quantity) {
		Request request = buildRequest();
		request.setQuantityRequested(quantity);

		Request saved = requestRepository.save(request);

		assertThat(requestRepository.findById(saved.getRequestId()).orElseThrow().getQuantityRequested())
				.isEqualTo(quantity);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.01, 150.0, 9999.99, 1000000.0})
	void saveWithBoundaryPrices(double price) {
		Request request = buildRequest();
		request.setActualPrice(price);

		Request saved = requestRepository.save(request);

		assertThat(requestRepository.findById(saved.getRequestId()).orElseThrow().getActualPrice())
				.isEqualTo(price);
	}

	@ParameterizedTest
	@CsvSource({
			"2020-01-01",
			"2024-02-29",
			"2026-06-15",
			"2030-12-31"
	})
	void saveWithVariousDates(String date) {
		LocalDate requestDate = LocalDate.parse(date);
		Request request = buildRequest();
		request.setRequestDate(requestDate);

		Request saved = requestRepository.save(request);

		assertThat(requestRepository.findById(saved.getRequestId()).orElseThrow().getRequestDate())
				.isEqualTo(requestDate);
	}

	@ParameterizedTest
	@CsvSource({
			"1,10,50,PE",
			"2,20,75,AP",
			"3,30,100,AP",
			"4,40,5,DL"
	})
	void saveWithVariousCombinations(int farmerId, int inputId, int quantity, RequestStatus status) {
		Request request = buildRequest();
		request.setFarmerId(farmerId);
		request.setInputId(inputId);
		request.setQuantityRequested(quantity);
		request.setStatus(status);

		Request saved = requestRepository.save(request);
		Request found = requestRepository.findById(saved.getRequestId()).orElseThrow();

		assertThat(found.getFarmerId()).isEqualTo(farmerId);
		assertThat(found.getInputId()).isEqualTo(inputId);
		assertThat(found.getQuantityRequested()).isEqualTo(quantity);
		assertThat(found.getStatus()).isEqualTo(status);
	}

	@Test
	void saveWithNullStatus() {
		Request request = buildRequest();
		request.setStatus(null);

		Request saved = requestRepository.save(request);

		assertThat(requestRepository.findById(saved.getRequestId()).orElseThrow().getStatus())
				.isNull();
	}

	@Test
	void countReturnsZeroWhenEmpty() {
		assertThat(requestRepository.count()).isZero();
	}

	@Test
	void countReturnsNumberOfRecords() {
		requestRepository.save(buildRequest());
		requestRepository.save(buildRequest());
		requestRepository.save(buildRequest());

		assertThat(requestRepository.count()).isEqualTo(3);
	}

	@Test
	void findAllReturnsEmptyWhenNoRecords() {
		assertThat(requestRepository.findAll()).isEmpty();
	}

	@Test
	void findAllReturnsManyRecords() {
		for (int i = 0; i < 6; i++) {
			requestRepository.save(buildRequest());
		}

		assertThat(requestRepository.findAll()).hasSize(6);
	}

	@Test
	void existsByIdReturnsTrueForSaved() {
		Request saved = requestRepository.save(buildRequest());

		assertThat(requestRepository.existsById(saved.getRequestId())).isTrue();
	}

	@Test
	void existsByIdReturnsFalseForMissing() {
		assertThat(requestRepository.existsById(9999)).isFalse();
	}

	@Test
	void findByIdReturnsEmptyForMissing() {
		assertThat(requestRepository.findById(9999)).isEmpty();
	}

	@Test
	void updateFarmerIdField() {
		Request saved = requestRepository.save(buildRequest());
		saved.setFarmerId(42);

		requestRepository.save(saved);

		assertThat(requestRepository.findById(saved.getRequestId()).orElseThrow().getFarmerId())
				.isEqualTo(42);
	}

	@Test
	void updateQuantityField() {
		Request saved = requestRepository.save(buildRequest());
		saved.setQuantityRequested(200);

		requestRepository.save(saved);

		assertThat(requestRepository.findById(saved.getRequestId()).orElseThrow().getQuantityRequested())
				.isEqualTo(200);
	}

	@Test
	void updateStatusField() {
		Request saved = requestRepository.save(buildRequest());
		saved.setStatus(RequestStatus.DL);

		requestRepository.save(saved);

		assertThat(requestRepository.findById(saved.getRequestId()).orElseThrow().getStatus())
				.isEqualTo(RequestStatus.DL);
	}

	@Test
	void updateRequestDateField() {
		Request saved = requestRepository.save(buildRequest());
		saved.setRequestDate(LocalDate.of(2027, 1, 1));

		requestRepository.save(saved);

		assertThat(requestRepository.findById(saved.getRequestId()).orElseThrow().getRequestDate())
				.isEqualTo(LocalDate.of(2027, 1, 1));
	}

	@Test
	void deleteThenGone() {
		Request saved = requestRepository.save(buildRequest());

		requestRepository.delete(saved);

		assertThat(requestRepository.findById(saved.getRequestId())).isEmpty();
	}

	@Test
	void deleteAllRemovesEverything() {
		requestRepository.save(buildRequest());
		requestRepository.save(buildRequest());

		requestRepository.deleteAll();

		assertThat(requestRepository.findAll()).isEmpty();
	}

	@Test
	void generatedIdIsNotNull() {
		Request saved = requestRepository.save(buildRequest());

		assertThat(saved.getRequestId()).isNotNull();
	}
}

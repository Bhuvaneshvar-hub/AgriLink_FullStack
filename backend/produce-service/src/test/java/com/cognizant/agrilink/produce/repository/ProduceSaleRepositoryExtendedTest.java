package com.cognizant.agrilink.produce.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.produce.entity.ProduceSale;
import com.cognizant.agrilink.produce.enums.PaymentStatus;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class ProduceSaleRepositoryExtendedTest {

	@Autowired
	private ProduceSaleRepository produceSaleRepository;

	private ProduceSale buildProduceSale() {
		return ProduceSale.builder()
				.listingId(1)
				.buyerId(1)
				.quantitySoldKg(300.0)
				.agreedPricePerKg(24.0)
				.totalAmount(7200.0)
				.saleDate(LocalDate.of(2026, 6, 15))
				.paymentStatus(PaymentStatus.PD)
				.build();
	}

	@ParameterizedTest
	@EnumSource(PaymentStatus.class)
	void savePersistsEachPaymentStatus(PaymentStatus paymentStatus) {
		ProduceSale sale = buildProduceSale();
		sale.setPaymentStatus(paymentStatus);

		ProduceSale saved = produceSaleRepository.save(sale);

		assertThat(produceSaleRepository.findById(saved.getSaleId()).orElseThrow().getPaymentStatus())
				.isEqualTo(paymentStatus);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.5, 1.0, 500.0, 99999.99})
	void savePersistsBoundaryQuantitiesSold(double quantity) {
		ProduceSale sale = buildProduceSale();
		sale.setQuantitySoldKg(quantity);

		ProduceSale saved = produceSaleRepository.save(sale);

		assertThat(produceSaleRepository.findById(saved.getSaleId()).orElseThrow().getQuantitySoldKg())
				.isEqualTo(quantity);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.01, 24.0, 9999.99})
	void savePersistsBoundaryAgreedPrices(double price) {
		ProduceSale sale = buildProduceSale();
		sale.setAgreedPricePerKg(price);

		ProduceSale saved = produceSaleRepository.save(sale);

		assertThat(produceSaleRepository.findById(saved.getSaleId()).orElseThrow().getAgreedPricePerKg())
				.isEqualTo(price);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 100.0, 7200.0, 1000000.0})
	void savePersistsBoundaryTotalAmounts(double amount) {
		ProduceSale sale = buildProduceSale();
		sale.setTotalAmount(amount);

		ProduceSale saved = produceSaleRepository.save(sale);

		assertThat(produceSaleRepository.findById(saved.getSaleId()).orElseThrow().getTotalAmount())
				.isEqualTo(amount);
	}

	@ParameterizedTest
	@CsvSource({"1,1", "2,5", "999,1000", "50,42"})
	void savePersistsVariousIds(int listingId, int buyerId) {
		ProduceSale sale = buildProduceSale();
		sale.setListingId(listingId);
		sale.setBuyerId(buyerId);

		ProduceSale saved = produceSaleRepository.save(sale);

		ProduceSale found = produceSaleRepository.findById(saved.getSaleId()).orElseThrow();
		assertThat(found.getListingId()).isEqualTo(listingId);
		assertThat(found.getBuyerId()).isEqualTo(buyerId);
	}

	@ParameterizedTest
	@CsvSource({"2026-01-01", "2025-12-31", "2026-06-15", "2024-02-29"})
	void savePersistsVariousSaleDates(String date) {
		ProduceSale sale = buildProduceSale();
		sale.setSaleDate(LocalDate.parse(date));

		ProduceSale saved = produceSaleRepository.save(sale);

		assertThat(produceSaleRepository.findById(saved.getSaleId()).orElseThrow().getSaleDate())
				.isEqualTo(LocalDate.parse(date));
	}

	@ParameterizedTest
	@NullSource
	void savePersistsBlankOrNullPaymentStatus(PaymentStatus paymentStatus) {
		ProduceSale sale = buildProduceSale();
		sale.setPaymentStatus(paymentStatus);

		ProduceSale saved = produceSaleRepository.save(sale);

		assertThat(produceSaleRepository.findById(saved.getSaleId()).orElseThrow().getPaymentStatus())
				.isEqualTo(paymentStatus);
	}

	@ParameterizedTest
	@NullSource
	void savePersistsNullSaleDate(LocalDate date) {
		ProduceSale sale = buildProduceSale();
		sale.setSaleDate(date);

		ProduceSale saved = produceSaleRepository.save(sale);

		assertThat(produceSaleRepository.findById(saved.getSaleId()).orElseThrow().getSaleDate())
				.isNull();
	}

	@Test
	void countReturnsNumberOfRecords() {
		produceSaleRepository.save(buildProduceSale());
		produceSaleRepository.save(buildProduceSale());
		produceSaleRepository.save(buildProduceSale());

		assertThat(produceSaleRepository.count()).isEqualTo(3);
	}

	@Test
	void existsByIdReturnsTrueWhenPresent() {
		ProduceSale saved = produceSaleRepository.save(buildProduceSale());

		assertThat(produceSaleRepository.existsById(saved.getSaleId())).isTrue();
	}

	@Test
	void existsByIdReturnsFalseWhenMissing() {
		assertThat(produceSaleRepository.existsById(9999)).isFalse();
	}

	@Test
	void findAllReturnsEmptyWhenNoRecords() {
		assertThat(produceSaleRepository.findAll()).isEmpty();
	}

	@Test
	void findAllReturnsManyRecords() {
		for (int i = 0; i < 5; i++) {
			produceSaleRepository.save(buildProduceSale());
		}

		assertThat(produceSaleRepository.findAll()).hasSize(5);
	}

	@Test
	void findByIdReturnsEmptyWhenMissing() {
		assertThat(produceSaleRepository.findById(12345)).isEmpty();
	}

	@Test
	void updateChangesPersistedFields() {
		ProduceSale saved = produceSaleRepository.save(buildProduceSale());

		saved.setPaymentStatus(PaymentStatus.OV);
		saved.setTotalAmount(123.4);
		produceSaleRepository.save(saved);

		ProduceSale found = produceSaleRepository.findById(saved.getSaleId()).orElseThrow();
		assertThat(found.getPaymentStatus()).isEqualTo(PaymentStatus.OV);
		assertThat(found.getTotalAmount()).isEqualTo(123.4);
	}

	@Test
	void deleteThenGone() {
		ProduceSale saved = produceSaleRepository.save(buildProduceSale());

		produceSaleRepository.delete(saved);

		assertThat(produceSaleRepository.findById(saved.getSaleId())).isEmpty();
	}

	@Test
	void deleteAllRemovesEverything() {
		produceSaleRepository.save(buildProduceSale());
		produceSaleRepository.save(buildProduceSale());

		produceSaleRepository.deleteAll();

		assertThat(produceSaleRepository.count()).isZero();
	}
}

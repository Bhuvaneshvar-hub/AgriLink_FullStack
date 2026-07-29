package com.cognizant.agrilink.produce.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.produce.entity.ProduceSale;
import com.cognizant.agrilink.produce.enums.PaymentStatus;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class ProduceSaleRepositoryTest {

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

	@Test
	void saveAndFindById() {
		ProduceSale saved = produceSaleRepository.save(buildProduceSale());

		ProduceSale found = produceSaleRepository.findById(saved.getSaleId()).orElseThrow();

		assertThat(found.getPaymentStatus()).isEqualTo(PaymentStatus.PD);
		assertThat(found.getTotalAmount()).isEqualTo(7200.0);
	}

	@Test
	void findAllReturnsSavedRecords() {
		produceSaleRepository.save(buildProduceSale());
		produceSaleRepository.save(buildProduceSale());

		assertThat(produceSaleRepository.findAll()).hasSize(2);
	}

	@Test
	void deleteRemovesRecord() {
		ProduceSale saved = produceSaleRepository.save(buildProduceSale());

		produceSaleRepository.deleteById(saved.getSaleId());

		assertThat(produceSaleRepository.findById(saved.getSaleId())).isEmpty();
	}
}

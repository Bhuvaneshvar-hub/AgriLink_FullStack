package com.cognizant.agrilink.produce.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.produce.dto.ProduceSaleDto;
import com.cognizant.agrilink.produce.entity.ProduceSale;
import com.cognizant.agrilink.produce.enums.PaymentStatus;
import com.cognizant.agrilink.produce.repository.ProduceSaleRepository;
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
class ProduceSaleServiceTest {

	@Mock
	private ProduceSaleRepository produceSaleRepository;

	@InjectMocks
	private ProduceSaleService produceSaleService;

	private ProduceSale produceSale;
	private ProduceSaleDto dto;

	@BeforeEach
	void setUp() {
		produceSale = ProduceSale.builder()
				.saleId(1)
				.listingId(1)
				.buyerId(1)
				.quantitySoldKg(300.0)
				.agreedPricePerKg(24.0)
				.totalAmount(7200.0)
				.saleDate(LocalDate.of(2026, 6, 15))
				.paymentStatus(PaymentStatus.PD)
				.build();
		dto = ProduceSaleDto.builder()
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
	void getAllReturnsList() {
		when(produceSaleRepository.findAll()).thenReturn(List.of(produceSale));

		assertThat(produceSaleService.getAll()).hasSize(1);
		verify(produceSaleRepository).findAll();
	}

	@Test
	void getByIdReturnsRecord() {
		when(produceSaleRepository.findById(1)).thenReturn(Optional.of(produceSale));

		assertThat(produceSaleService.getById(1).getPaymentStatus()).isEqualTo(PaymentStatus.PD);
	}

	@Test
	void getByIdThrowsWhenMissing() {
		when(produceSaleRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> produceSaleService.getById(99))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@Test
	void createSavesRecord() {
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.create(dto);

		verify(produceSaleRepository).save(any(ProduceSale.class));
	}

	@Test
	void updateModifiesRecord() {
		when(produceSaleRepository.findById(1)).thenReturn(Optional.of(produceSale));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.update(1, dto);

		verify(produceSaleRepository).save(any(ProduceSale.class));
	}

	@Test
	void deleteRemovesRecord() {
		when(produceSaleRepository.findById(1)).thenReturn(Optional.of(produceSale));

		produceSaleService.delete(1);

		verify(produceSaleRepository, times(1)).delete(produceSale);
	}
}

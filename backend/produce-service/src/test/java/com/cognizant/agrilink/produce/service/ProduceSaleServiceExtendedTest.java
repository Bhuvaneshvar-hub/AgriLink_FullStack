package com.cognizant.agrilink.produce.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.produce.dto.ProduceSaleDto;
import com.cognizant.agrilink.produce.entity.ProduceSale;
import com.cognizant.agrilink.produce.enums.PaymentStatus;
import com.cognizant.agrilink.produce.repository.ProduceSaleRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.EnumSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProduceSaleServiceExtendedTest {

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
	void getAllReturnsEmptyList() {
		when(produceSaleRepository.findAll()).thenReturn(Collections.emptyList());

		assertThat(produceSaleService.getAll()).isEmpty();
		verify(produceSaleRepository).findAll();
	}

	@Test
	void getAllReturnsManyRecords() {
		when(produceSaleRepository.findAll())
				.thenReturn(List.of(produceSale, produceSale, produceSale));

		assertThat(produceSaleService.getAll()).hasSize(3);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 50, 999, 123456})
	void getByIdReturnsRecordForVariousIds(int id) {
		when(produceSaleRepository.findById(id)).thenReturn(Optional.of(produceSale));

		assertThat(produceSaleService.getById(id)).isNotNull();
		verify(produceSaleRepository).findById(id);
	}

	@ParameterizedTest
	@ValueSource(ints = {99, 1000, 7777})
	void getByIdThrowsWithMessageWhenMissing(int id) {
		when(produceSaleRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> produceSaleService.getById(id))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("ProduceSale not found with id " + id);
	}

	@Test
	void getByIdNeverCallsSave() {
		when(produceSaleRepository.findById(1)).thenReturn(Optional.of(produceSale));

		produceSaleService.getById(1);

		verify(produceSaleRepository, never()).save(any(ProduceSale.class));
	}

	@ParameterizedTest
	@EnumSource(PaymentStatus.class)
	void createMapsPaymentStatus(PaymentStatus paymentStatus) {
		dto.setPaymentStatus(paymentStatus);
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.create(dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getPaymentStatus()).isEqualTo(paymentStatus);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.5, 1.0, 300.0, 99999.99})
	void createMapsQuantitySold(double quantity) {
		dto.setQuantitySoldKg(quantity);
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.create(dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getQuantitySoldKg()).isEqualTo(quantity);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.01, 24.0, 9999.99})
	void createMapsAgreedPrice(double price) {
		dto.setAgreedPricePerKg(price);
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.create(dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getAgreedPricePerKg()).isEqualTo(price);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 100.0, 7200.0, 1000000.0})
	void createMapsTotalAmount(double amount) {
		dto.setTotalAmount(amount);
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.create(dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getTotalAmount()).isEqualTo(amount);
	}

	@ParameterizedTest
	@CsvSource({"1,1", "2,5", "999,1000"})
	void createMapsIds(int listingId, int buyerId) {
		dto.setListingId(listingId);
		dto.setBuyerId(buyerId);
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.create(dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getListingId()).isEqualTo(listingId);
		assertThat(captor.getValue().getBuyerId()).isEqualTo(buyerId);
	}

	@ParameterizedTest
	@NullSource
	void createMapsBlankOrNullPaymentStatus(PaymentStatus paymentStatus) {
		dto.setPaymentStatus(paymentStatus);
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.create(dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getPaymentStatus()).isEqualTo(PaymentStatus.PE);
	}

	@Test
	void createMapsSaleDate() {
		dto.setSaleDate(LocalDate.of(2025, 1, 1));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.create(dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getSaleDate()).isEqualTo(LocalDate.of(2025, 1, 1));
	}

	@Test
	void updateChangesListingId() {
		dto.setListingId(42);
		when(produceSaleRepository.findById(1)).thenReturn(Optional.of(produceSale));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.update(1, dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getListingId()).isEqualTo(42);
	}

	@Test
	void updateChangesBuyerId() {
		dto.setBuyerId(77);
		when(produceSaleRepository.findById(1)).thenReturn(Optional.of(produceSale));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.update(1, dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getBuyerId()).isEqualTo(77);
	}

	@Test
	void updateChangesQuantitySold() {
		dto.setQuantitySoldKg(888.0);
		when(produceSaleRepository.findById(1)).thenReturn(Optional.of(produceSale));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.update(1, dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getQuantitySoldKg()).isEqualTo(888.0);
	}

	@Test
	void updateChangesAgreedPrice() {
		dto.setAgreedPricePerKg(99.9);
		when(produceSaleRepository.findById(1)).thenReturn(Optional.of(produceSale));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.update(1, dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getAgreedPricePerKg()).isEqualTo(99.9);
	}

	@Test
	void updateChangesTotalAmount() {
		dto.setTotalAmount(54321.0);
		when(produceSaleRepository.findById(1)).thenReturn(Optional.of(produceSale));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.update(1, dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getTotalAmount()).isEqualTo(54321.0);
	}

	@Test
	void updateChangesSaleDate() {
		dto.setSaleDate(LocalDate.of(2027, 3, 3));
		when(produceSaleRepository.findById(1)).thenReturn(Optional.of(produceSale));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.update(1, dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getSaleDate()).isEqualTo(LocalDate.of(2027, 3, 3));
	}

	@Test
	void updateChangesPaymentStatus() {
		dto.setPaymentStatus(PaymentStatus.FL);
		when(produceSaleRepository.findById(1)).thenReturn(Optional.of(produceSale));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenReturn(produceSale);

		produceSaleService.update(1, dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getPaymentStatus()).isEqualTo(PaymentStatus.FL);
	}

	@Test
	void updateThrowsWhenMissingAndNeverSaves() {
		when(produceSaleRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> produceSaleService.update(99, dto))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("ProduceSale not found with id 99");
		verify(produceSaleRepository, never()).save(any(ProduceSale.class));
	}

	@Test
	void deleteCallsRepositoryDeleteOnce() {
		when(produceSaleRepository.findById(1)).thenReturn(Optional.of(produceSale));

		produceSaleService.delete(1);

		verify(produceSaleRepository, times(1)).delete(produceSale);
	}

	@Test
	void deleteThrowsWhenMissingAndNeverDeletes() {
		when(produceSaleRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> produceSaleService.delete(99))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("ProduceSale not found with id 99");
		verify(produceSaleRepository, never()).delete(any(ProduceSale.class));
	}
}

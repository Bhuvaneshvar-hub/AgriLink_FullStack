package com.cognizant.agrilink.produce.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.produce.dto.ProduceSaleDto;
import com.cognizant.agrilink.produce.entity.ProduceListing;
import com.cognizant.agrilink.produce.entity.ProduceSale;
import com.cognizant.agrilink.produce.enums.ListingStatus;
import com.cognizant.agrilink.produce.enums.PaymentStatus;
import com.cognizant.agrilink.produce.repository.ProduceListingRepository;
import com.cognizant.agrilink.produce.repository.ProduceSaleRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * The marketplace rules layered on top of plain sale CRUD: a buyer may never take
 * more than the quantity still available, never agree a price below
 * {@code MIN_OFFER_PERCENT_OF_ASKING}% of the asking price, and the selling farmer
 * separately confirms that a settled payment actually arrived.
 */
@ExtendWith(MockitoExtension.class)
class ProduceSaleServiceMarketRulesTest {

	@Mock
	private ProduceSaleRepository produceSaleRepository;

	@Mock
	private ProduceListingRepository produceListingRepository;

	@InjectMocks
	private ProduceSaleService produceSaleService;

	private ProduceListing listing;
	private ProduceSaleDto dto;

	@BeforeEach
	void setUp() {
		// 1000 Kg listed at 20.00/Kg, so the price floor sits at 18.00/Kg.
		listing = ProduceListing.builder()
				.listingId(1)
				.farmerId(1)
				.cropId(1)
				.harvestDate(LocalDate.of(2026, 6, 1))
				.quantityKg(1000.0)
				.qualityGrade("A")
				.askingPricePerKg(20.0)
				.status(ListingStatus.AV)
				.build();
		dto = ProduceSaleDto.builder()
				.listingId(1)
				.buyerId(4)
				.quantitySoldKg(400.0)
				.agreedPricePerKg(20.0)
				.totalAmount(8000.0)
				.saleDate(LocalDate.of(2026, 6, 10))
				.paymentStatus(PaymentStatus.PE)
				.build();
	}

	private ProduceSale existingSale(double quantitySoldKg) {
		return ProduceSale.builder()
				.saleId(9)
				.listingId(1)
				.buyerId(4)
				.quantitySoldKg(quantitySoldKg)
				.agreedPricePerKg(20.0)
				.totalAmount(quantitySoldKg * 20.0)
				.saleDate(LocalDate.of(2026, 6, 5))
				.paymentStatus(PaymentStatus.PE)
				.build();
	}

	// ---------- available quantity ----------

	@Test
	void availableQuantityIsListedMinusSold() {
		when(produceSaleRepository.findByListingId(1)).thenReturn(List.of(existingSale(300.0), existingSale(200.0)));

		assertThat(produceSaleService.availableQuantityKg(listing)).isEqualTo(500.0);
	}

	@Test
	void availableQuantityNeverGoesNegative() {
		when(produceSaleRepository.findByListingId(1)).thenReturn(List.of(existingSale(1500.0)));

		assertThat(produceSaleService.availableQuantityKg(listing)).isZero();
	}

	@Test
	void applyAvailableQuantityPopulatesEveryListingInBatch() {
		ProduceListing second = ProduceListing.builder().listingId(2).quantityKg(500.0).build();
		ProduceSale saleOnFirst = existingSale(600.0);
		ProduceSale saleOnSecond = ProduceSale.builder().saleId(11).listingId(2).quantitySoldKg(100.0).build();
		when(produceSaleRepository.findByListingIdIn(List.of(1, 2)))
				.thenReturn(List.of(saleOnFirst, saleOnSecond));

		produceSaleService.applyAvailableQuantity(List.of(listing, second));

		assertThat(listing.getAvailableQuantityKg()).isEqualTo(400.0);
		assertThat(second.getAvailableQuantityKg()).isEqualTo(400.0);
	}

	@Test
	void applyAvailableQuantityToleratesEmptyBatch() {
		produceSaleService.applyAvailableQuantity(List.of());

		verify(produceSaleRepository, never()).findByListingIdIn(any());
	}

	// ---------- quantity cap ----------

	@Test
	void createRejectsQuantityBeyondWhatRemains() {
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(listing));
		when(produceSaleRepository.findByListingId(1)).thenReturn(List.of(existingSale(800.0)));
		dto.setQuantitySoldKg(400.0);

		assertThatThrownBy(() -> produceSaleService.create(dto))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("200.00 Kg still available");
		verify(produceSaleRepository, never()).save(any(ProduceSale.class));
	}

	@Test
	void createAcceptsQuantityExactlyMatchingWhatRemains() {
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(listing));
		when(produceSaleRepository.findByListingId(1)).thenReturn(List.of(existingSale(600.0)));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenAnswer(inv -> inv.getArgument(0));
		dto.setQuantitySoldKg(400.0);

		produceSaleService.create(dto);

		verify(produceSaleRepository).save(any(ProduceSale.class));
	}

	@Test
	void createRejectsPurchaseFromWithdrawnListing() {
		listing.setStatus(ListingStatus.WD);
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(listing));

		assertThatThrownBy(() -> produceSaleService.create(dto))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("withdrawn");
	}

	@Test
	void updateExcludesTheSaleBeingAmendedFromTheAvailabilitySum() {
		ProduceSale existing = existingSale(1000.0);
		when(produceSaleRepository.findById(9)).thenReturn(Optional.of(existing));
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(listing));
		when(produceSaleRepository.findByListingId(1)).thenReturn(List.of(existing));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenAnswer(inv -> inv.getArgument(0));
		dto.setQuantitySoldKg(1000.0);

		produceSaleService.update(9, dto);

		verify(produceSaleRepository).save(any(ProduceSale.class));
	}

	// ---------- price floor ----------

	@ParameterizedTest
	@ValueSource(doubles = {17.99, 15.0, 1.0})
	void createRejectsPriceBelowTheFloor(double agreedPricePerKg) {
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(listing));
		dto.setAgreedPricePerKg(agreedPricePerKg);

		assertThatThrownBy(() -> produceSaleService.create(dto))
				.isInstanceOf(IllegalArgumentException.class)
				.hasMessageContaining("below the minimum");
		verify(produceSaleRepository, never()).save(any(ProduceSale.class));
	}

	@ParameterizedTest
	@ValueSource(doubles = {18.0, 19.5, 20.0, 25.0})
	void createAcceptsPriceAtOrAboveTheFloor(double agreedPricePerKg) {
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(listing));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenAnswer(inv -> inv.getArgument(0));
		dto.setAgreedPricePerKg(agreedPricePerKg);

		produceSaleService.create(dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getAgreedPricePerKg()).isEqualTo(agreedPricePerKg);
	}

	@Test
	void updateAllowsAnUnchangedPriceThatPredatesTheFloor() {
		ProduceSale existing = existingSale(400.0);
		existing.setAgreedPricePerKg(5.0);
		when(produceSaleRepository.findById(9)).thenReturn(Optional.of(existing));
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(listing));
		when(produceSaleRepository.findByListingId(1)).thenReturn(List.of(existing));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenAnswer(inv -> inv.getArgument(0));
		// Settling the payment on a legacy sale must not be blocked by its old price.
		dto.setAgreedPricePerKg(5.0);
		dto.setPaymentStatus(PaymentStatus.PD);

		produceSaleService.update(9, dto);

		verify(produceSaleRepository).save(any(ProduceSale.class));
	}

	// ---------- farmer receipt confirmation ----------

	@Test
	void createStartsUnconfirmed() {
		when(produceSaleRepository.save(any(ProduceSale.class))).thenAnswer(inv -> inv.getArgument(0));

		produceSaleService.create(dto);

		ArgumentCaptor<ProduceSale> captor = ArgumentCaptor.forClass(ProduceSale.class);
		verify(produceSaleRepository).save(captor.capture());
		assertThat(captor.getValue().getFarmerPaymentConfirmed()).isFalse();
	}

	@Test
	void confirmFarmerPaymentStampsTheConfirmation() {
		ProduceSale paid = existingSale(400.0);
		paid.setPaymentStatus(PaymentStatus.PD);
		when(produceSaleRepository.findById(9)).thenReturn(Optional.of(paid));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenAnswer(inv -> inv.getArgument(0));

		ProduceSale confirmed = produceSaleService.confirmFarmerPayment(9);

		assertThat(confirmed.getFarmerPaymentConfirmed()).isTrue();
		assertThat(confirmed.getFarmerConfirmedDate()).isEqualTo(LocalDate.now());
	}

	@Test
	void confirmFarmerPaymentIsIdempotent() {
		ProduceSale paid = existingSale(400.0);
		paid.setPaymentStatus(PaymentStatus.PD);
		paid.setFarmerPaymentConfirmed(true);
		paid.setFarmerConfirmedDate(LocalDate.of(2026, 6, 20));
		when(produceSaleRepository.findById(9)).thenReturn(Optional.of(paid));

		ProduceSale confirmed = produceSaleService.confirmFarmerPayment(9);

		assertThat(confirmed.getFarmerConfirmedDate()).isEqualTo(LocalDate.of(2026, 6, 20));
		verify(produceSaleRepository, never()).save(any(ProduceSale.class));
	}

	@ParameterizedTest
	@ValueSource(strings = {"PE", "OV"})
	void confirmFarmerPaymentRejectsUnsettledSales(String paymentStatus) {
		ProduceSale unsettled = existingSale(400.0);
		unsettled.setPaymentStatus(PaymentStatus.valueOf(paymentStatus));
		when(produceSaleRepository.findById(9)).thenReturn(Optional.of(unsettled));

		assertThatThrownBy(() -> produceSaleService.confirmFarmerPayment(9))
				.isInstanceOf(IllegalStateException.class)
				.hasMessageContaining("marked this payment as Paid");
	}

	@Test
	void updateClearsConfirmationWhenPaymentLeavesPaid() {
		ProduceSale confirmed = existingSale(400.0);
		confirmed.setPaymentStatus(PaymentStatus.PD);
		confirmed.setFarmerPaymentConfirmed(true);
		confirmed.setFarmerConfirmedDate(LocalDate.of(2026, 6, 20));
		when(produceSaleRepository.findById(9)).thenReturn(Optional.of(confirmed));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenAnswer(inv -> inv.getArgument(0));
		dto.setPaymentStatus(PaymentStatus.PE);

		ProduceSale saved = produceSaleService.update(9, dto);

		assertThat(saved.getFarmerPaymentConfirmed()).isFalse();
		assertThat(saved.getFarmerConfirmedDate()).isNull();
	}

	@Test
	void updatePreservesConfirmationCarriedOnThePayload() {
		ProduceSale existing = existingSale(400.0);
		existing.setPaymentStatus(PaymentStatus.PD);
		when(produceSaleRepository.findById(9)).thenReturn(Optional.of(existing));
		when(produceSaleRepository.save(any(ProduceSale.class))).thenAnswer(inv -> inv.getArgument(0));
		dto.setPaymentStatus(PaymentStatus.PD);
		dto.setFarmerPaymentConfirmed(true);
		dto.setFarmerConfirmedDate(LocalDate.of(2026, 6, 22));

		ProduceSale saved = produceSaleService.update(9, dto);

		assertThat(saved.getFarmerPaymentConfirmed()).isTrue();
		assertThat(saved.getFarmerConfirmedDate()).isEqualTo(LocalDate.of(2026, 6, 22));
	}
}

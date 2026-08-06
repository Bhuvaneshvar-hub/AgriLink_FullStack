package com.cognizant.agrilink.produce.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.produce.dto.ProduceListingDto;
import com.cognizant.agrilink.produce.entity.ProduceListing;
import com.cognizant.agrilink.produce.enums.ListingStatus;
import com.cognizant.agrilink.produce.repository.ProduceListingRepository;
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
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ProduceListingServiceExtendedTest {

	@Mock
	private ProduceListingRepository produceListingRepository;

	@InjectMocks
	private ProduceListingService produceListingService;

	private ProduceListing produceListing;
	private ProduceListingDto dto;

	@BeforeEach
	void setUp() {
		produceListing = ProduceListing.builder()
				.listingId(1)
				.farmerId(1)
				.cropId(1)
				.harvestDate(LocalDate.of(2026, 6, 15))
				.quantityKg(500.0)
				.qualityGrade("A")
				.askingPricePerKg(25.5)
				.status(ListingStatus.AV)
				.build();
		dto = ProduceListingDto.builder()
				.farmerId(1)
				.cropId(1)
				.harvestDate(LocalDate.of(2026, 6, 15))
				.quantityKg(500.0)
				.qualityGrade("A")
				.askingPricePerKg(25.5)
				.status(ListingStatus.AV)
				.build();
	}

	@Test
	void getAllReturnsEmptyList() {
		when(produceListingRepository.findAll()).thenReturn(Collections.emptyList());

		assertThat(produceListingService.getAll()).isEmpty();
		verify(produceListingRepository).findAll();
	}

	@Test
	void getAllReturnsManyRecords() {
		when(produceListingRepository.findAll())
				.thenReturn(List.of(produceListing, produceListing, produceListing));

		assertThat(produceListingService.getAll()).hasSize(3);
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 50, 999, 123456})
	void getByIdReturnsRecordForVariousIds(int id) {
		when(produceListingRepository.findById(id)).thenReturn(Optional.of(produceListing));

		assertThat(produceListingService.getById(id)).isNotNull();
		verify(produceListingRepository).findById(id);
	}

	@ParameterizedTest
	@ValueSource(ints = {99, 1000, 7777})
	void getByIdThrowsWithMessageWhenMissing(int id) {
		when(produceListingRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> produceListingService.getById(id))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("ProduceListing not found with id " + id);
	}

	@Test
	void getByIdNeverCallsSave() {
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(produceListing));

		produceListingService.getById(1);

		verify(produceListingRepository, never()).save(any(ProduceListing.class));
	}

	@ParameterizedTest
	@EnumSource(ListingStatus.class)
	void createMapsStatus(ListingStatus status) {
		dto.setStatus(status);
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.create(dto);

		ArgumentCaptor<ProduceListing> captor = ArgumentCaptor.forClass(ProduceListing.class);
		verify(produceListingRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(strings = {"A", "B", "C"})
	void createMapsQualityGrade(String grade) {
		dto.setQualityGrade(grade);
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.create(dto);

		ArgumentCaptor<ProduceListing> captor = ArgumentCaptor.forClass(ProduceListing.class);
		verify(produceListingRepository).save(captor.capture());
		assertThat(captor.getValue().getQualityGrade()).isEqualTo(grade);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.5, 1.0, 500.0, 100000.0})
	void createMapsQuantity(double quantity) {
		dto.setQuantityKg(quantity);
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.create(dto);

		ArgumentCaptor<ProduceListing> captor = ArgumentCaptor.forClass(ProduceListing.class);
		verify(produceListingRepository).save(captor.capture());
		assertThat(captor.getValue().getQuantityKg()).isEqualTo(quantity);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, 0.01, 25.5, 9999.99})
	void createMapsAskingPrice(double price) {
		dto.setAskingPricePerKg(price);
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.create(dto);

		ArgumentCaptor<ProduceListing> captor = ArgumentCaptor.forClass(ProduceListing.class);
		verify(produceListingRepository).save(captor.capture());
		assertThat(captor.getValue().getAskingPricePerKg()).isEqualTo(price);
	}

	@ParameterizedTest
	@CsvSource({"1,1", "2,5", "999,1000"})
	void createMapsIds(int farmerId, int cropId) {
		dto.setFarmerId(farmerId);
		dto.setCropId(cropId);
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.create(dto);

		ArgumentCaptor<ProduceListing> captor = ArgumentCaptor.forClass(ProduceListing.class);
		verify(produceListingRepository).save(captor.capture());
		assertThat(captor.getValue().getFarmerId()).isEqualTo(farmerId);
		assertThat(captor.getValue().getCropId()).isEqualTo(cropId);
	}

	@ParameterizedTest
	@NullSource
	void createMapsBlankOrNullStatus(ListingStatus status) {
		dto.setStatus(status);
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.create(dto);

		ArgumentCaptor<ProduceListing> captor = ArgumentCaptor.forClass(ProduceListing.class);
		verify(produceListingRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(ListingStatus.AV);
	}

	@Test
	void createMapsHarvestDate() {
		dto.setHarvestDate(LocalDate.of(2025, 1, 1));
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.create(dto);

		ArgumentCaptor<ProduceListing> captor = ArgumentCaptor.forClass(ProduceListing.class);
		verify(produceListingRepository).save(captor.capture());
		assertThat(captor.getValue().getHarvestDate()).isEqualTo(LocalDate.of(2025, 1, 1));
	}

	@Test
	void updateChangesFarmerId() {
		dto.setFarmerId(42);
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(produceListing));
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.update(1, dto);

		ArgumentCaptor<ProduceListing> captor = ArgumentCaptor.forClass(ProduceListing.class);
		verify(produceListingRepository).save(captor.capture());
		assertThat(captor.getValue().getFarmerId()).isEqualTo(42);
	}

	@Test
	void updateChangesCropId() {
		dto.setCropId(77);
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(produceListing));
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.update(1, dto);

		ArgumentCaptor<ProduceListing> captor = ArgumentCaptor.forClass(ProduceListing.class);
		verify(produceListingRepository).save(captor.capture());
		assertThat(captor.getValue().getCropId()).isEqualTo(77);
	}

	@Test
	void updateChangesHarvestDate() {
		dto.setHarvestDate(LocalDate.of(2027, 3, 3));
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(produceListing));
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.update(1, dto);

		ArgumentCaptor<ProduceListing> captor = ArgumentCaptor.forClass(ProduceListing.class);
		verify(produceListingRepository).save(captor.capture());
		assertThat(captor.getValue().getHarvestDate()).isEqualTo(LocalDate.of(2027, 3, 3));
	}

	@Test
	void updateChangesQuantity() {
		dto.setQuantityKg(888.0);
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(produceListing));
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.update(1, dto);

		ArgumentCaptor<ProduceListing> captor = ArgumentCaptor.forClass(ProduceListing.class);
		verify(produceListingRepository).save(captor.capture());
		assertThat(captor.getValue().getQuantityKg()).isEqualTo(888.0);
	}

	@Test
	void updateChangesQualityGrade() {
		dto.setQualityGrade("C");
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(produceListing));
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.update(1, dto);

		ArgumentCaptor<ProduceListing> captor = ArgumentCaptor.forClass(ProduceListing.class);
		verify(produceListingRepository).save(captor.capture());
		assertThat(captor.getValue().getQualityGrade()).isEqualTo("C");
	}

	@Test
	void updateChangesAskingPrice() {
		dto.setAskingPricePerKg(99.9);
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(produceListing));
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.update(1, dto);

		ArgumentCaptor<ProduceListing> captor = ArgumentCaptor.forClass(ProduceListing.class);
		verify(produceListingRepository).save(captor.capture());
		assertThat(captor.getValue().getAskingPricePerKg()).isEqualTo(99.9);
	}

	@Test
	void updateChangesStatus() {
		dto.setStatus(ListingStatus.WD);
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(produceListing));
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.update(1, dto);

		ArgumentCaptor<ProduceListing> captor = ArgumentCaptor.forClass(ProduceListing.class);
		verify(produceListingRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(ListingStatus.WD);
	}

	@Test
	void updateThrowsWhenMissingAndNeverSaves() {
		when(produceListingRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> produceListingService.update(99, dto))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("ProduceListing not found with id 99");
		verify(produceListingRepository, never()).save(any(ProduceListing.class));
	}

	@Test
	void deleteCallsRepositoryDeleteOnce() {
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(produceListing));

		produceListingService.delete(1);

		verify(produceListingRepository, times(1)).delete(produceListing);
	}

	@Test
	void deleteThrowsWhenMissingAndNeverDeletes() {
		when(produceListingRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> produceListingService.delete(99))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessage("ProduceListing not found with id 99");
		verify(produceListingRepository, never()).delete(any(ProduceListing.class));
	}
}

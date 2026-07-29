package com.cognizant.agrilink.produce.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.produce.dto.ProduceListingDto;
import com.cognizant.agrilink.produce.entity.ProduceListing;
import com.cognizant.agrilink.produce.enums.ListingStatus;
import com.cognizant.agrilink.produce.repository.ProduceListingRepository;
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
class ProduceListingServiceTest {

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
	void getAllReturnsList() {
		when(produceListingRepository.findAll()).thenReturn(List.of(produceListing));

		assertThat(produceListingService.getAll()).hasSize(1);
		verify(produceListingRepository).findAll();
	}

	@Test
	void getByIdReturnsRecord() {
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(produceListing));

		assertThat(produceListingService.getById(1).getQualityGrade()).isEqualTo("A");
	}

	@Test
	void getByIdThrowsWhenMissing() {
		when(produceListingRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> produceListingService.getById(99))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@Test
	void createSavesRecord() {
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.create(dto);

		verify(produceListingRepository).save(any(ProduceListing.class));
	}

	@Test
	void updateModifiesRecord() {
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(produceListing));
		when(produceListingRepository.save(any(ProduceListing.class))).thenReturn(produceListing);

		produceListingService.update(1, dto);

		verify(produceListingRepository).save(any(ProduceListing.class));
	}

	@Test
	void deleteRemovesRecord() {
		when(produceListingRepository.findById(1)).thenReturn(Optional.of(produceListing));

		produceListingService.delete(1);

		verify(produceListingRepository, times(1)).delete(produceListing);
	}
}

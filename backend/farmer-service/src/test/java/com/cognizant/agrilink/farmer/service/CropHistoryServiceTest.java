package com.cognizant.agrilink.farmer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.farmer.dto.CropHistoryDto;
import com.cognizant.agrilink.farmer.entity.CropHistory;
import com.cognizant.agrilink.farmer.repository.CropHistoryRepository;
import jakarta.persistence.EntityNotFoundException;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CropHistoryServiceTest {

	@Mock
	private CropHistoryRepository cropHistoryRepository;

	@InjectMocks
	private CropHistoryService cropHistoryService;

	private CropHistory cropHistory;
	private CropHistoryDto dto;

	@BeforeEach
	void setUp() {
		cropHistory = CropHistory.builder()
				.historyId(1)
				.holdingId(1)
				.farmerId(1)
				.cropName("Paddy")
				.season("Kharif")
				.cropYear(2024)
				.areaAcres(4.2)
				.yieldQuintals(92.5)
				.remarks("Good monsoon")
				.build();
		dto = CropHistoryDto.builder()
				.holdingId(1)
				.farmerId(1)
				.cropName("Paddy")
				.season("Kharif")
				.cropYear(2024)
				.areaAcres(4.2)
				.yieldQuintals(92.5)
				.remarks("Good monsoon")
				.build();
	}

	@Test
	void getAllReturnsList() {
		when(cropHistoryRepository.findAll()).thenReturn(List.of(cropHistory));

		assertThat(cropHistoryService.getAll()).hasSize(1);
		verify(cropHistoryRepository).findAll();
	}

	@Test
	void getByFarmerIdsReturnsList() {
		when(cropHistoryRepository.findByFarmerIdIn(List.of(1))).thenReturn(List.of(cropHistory));

		assertThat(cropHistoryService.getByFarmerIds(List.of(1))).hasSize(1);
		verify(cropHistoryRepository).findByFarmerIdIn(List.of(1));
	}

	@Test
	void getByFarmerIdsReturnsEmptyForNullOrEmpty() {
		assertThat(cropHistoryService.getByFarmerIds(null)).isEmpty();
		assertThat(cropHistoryService.getByFarmerIds(List.of())).isEmpty();
	}

	@Test
	void getByHoldingIdReturnsList() {
		when(cropHistoryRepository.findByHoldingId(1)).thenReturn(List.of(cropHistory));

		assertThat(cropHistoryService.getByHoldingId(1)).hasSize(1);
		verify(cropHistoryRepository).findByHoldingId(1);
	}

	@Test
	void getByIdReturnsRecord() {
		when(cropHistoryRepository.findById(1)).thenReturn(Optional.of(cropHistory));

		assertThat(cropHistoryService.getById(1).getCropName()).isEqualTo("Paddy");
	}

	@Test
	void getByIdThrowsWhenMissing() {
		when(cropHistoryRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> cropHistoryService.getById(99))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@Test
	void createSavesRecord() {
		when(cropHistoryRepository.save(any(CropHistory.class))).thenReturn(cropHistory);

		cropHistoryService.create(dto);

		verify(cropHistoryRepository).save(any(CropHistory.class));
	}

	@Test
	void updateModifiesRecord() {
		when(cropHistoryRepository.findById(1)).thenReturn(Optional.of(cropHistory));
		when(cropHistoryRepository.save(any(CropHistory.class))).thenReturn(cropHistory);

		cropHistoryService.update(1, dto);

		verify(cropHistoryRepository).save(any(CropHistory.class));
	}

	@Test
	void deleteRemovesRecord() {
		when(cropHistoryRepository.findById(1)).thenReturn(Optional.of(cropHistory));

		cropHistoryService.delete(1);

		verify(cropHistoryRepository, times(1)).delete(cropHistory);
	}
}

package com.cognizant.agrilink.farmer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.farmer.dto.LandHoldingDto;
import com.cognizant.agrilink.farmer.entity.LandHolding;
import com.cognizant.agrilink.farmer.enums.Status;
import com.cognizant.agrilink.farmer.repository.LandHoldingRepository;
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
class LandHoldingServiceTest {

	@Mock
	private LandHoldingRepository landHoldingRepository;

	@InjectMocks
	private LandHoldingService landHoldingService;

	private LandHolding landHolding;
	private LandHoldingDto dto;

	@BeforeEach
	void setUp() {
		landHolding = LandHolding.builder()
				.holdingId(1)
				.farmerId(1)
				.surveyNumber("SY-101/2A")
				.areaAcres(5.5)
				.soilType("Black")
				.irrigationSource("Borewell")
				.ownershipType("Owned")
				.status(Status.AC)
				.build();
		dto = LandHoldingDto.builder()
				.farmerId(1)
				.surveyNumber("SY-101/2A")
				.areaAcres(5.5)
				.soilType("Black")
				.irrigationSource("Borewell")
				.ownershipType("Owned")
				.status(Status.AC)
				.build();
	}

	@Test
	void getAllReturnsList() {
		when(landHoldingRepository.findAll()).thenReturn(List.of(landHolding));

		assertThat(landHoldingService.getAll()).hasSize(1);
		verify(landHoldingRepository).findAll();
	}

	@Test
	void getByIdReturnsRecord() {
		when(landHoldingRepository.findById(1)).thenReturn(Optional.of(landHolding));

		assertThat(landHoldingService.getById(1).getSurveyNumber()).isEqualTo("SY-101/2A");
	}

	@Test
	void getByIdThrowsWhenMissing() {
		when(landHoldingRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> landHoldingService.getById(99))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@Test
	void createSavesRecord() {
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);

		landHoldingService.create(dto);

		verify(landHoldingRepository).save(any(LandHolding.class));
	}

	@Test
	void updateModifiesRecord() {
		when(landHoldingRepository.findById(1)).thenReturn(Optional.of(landHolding));
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);

		landHoldingService.update(1, dto);

		verify(landHoldingRepository).save(any(LandHolding.class));
	}

	@Test
	void deleteRemovesRecord() {
		when(landHoldingRepository.findById(1)).thenReturn(Optional.of(landHolding));

		landHoldingService.delete(1);

		verify(landHoldingRepository, times(1)).delete(landHolding);
	}
}

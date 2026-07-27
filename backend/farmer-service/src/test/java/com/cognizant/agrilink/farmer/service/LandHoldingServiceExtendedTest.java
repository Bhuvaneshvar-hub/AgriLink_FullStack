package com.cognizant.agrilink.farmer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
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
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class LandHoldingServiceExtendedTest {

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
	void getAllReturnsEmptyList() {
		when(landHoldingRepository.findAll()).thenReturn(List.of());

		assertThat(landHoldingService.getAll()).isEmpty();
		verify(landHoldingRepository).findAll();
	}

	@Test
	void getAllReturnsManyRecords() {
		when(landHoldingRepository.findAll()).thenReturn(List.of(landHolding, landHolding, landHolding));

		assertThat(landHoldingService.getAll()).hasSize(3);
	}

	@Test
	void getByIdReturnsCorrectSoilType() {
		when(landHoldingRepository.findById(1)).thenReturn(Optional.of(landHolding));

		assertThat(landHoldingService.getById(1).getSoilType()).isEqualTo("Black");
	}

	@Test
	void getByIdThrowsWithMessage() {
		when(landHoldingRepository.findById(42)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> landHoldingService.getById(42))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessageContaining("LandHolding not found with id 42");
	}

	@Test
	void createReturnsSavedEntity() {
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);

		LandHolding result = landHoldingService.create(dto);

		assertThat(result.getSurveyNumber()).isEqualTo("SY-101/2A");
	}

	@Test
	void createMapsAllFields() {
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		ArgumentCaptor<LandHolding> captor = ArgumentCaptor.forClass(LandHolding.class);

		landHoldingService.create(dto);

		verify(landHoldingRepository).save(captor.capture());
		LandHolding saved = captor.getValue();
		assertThat(saved.getFarmerId()).isEqualTo(1);
		assertThat(saved.getSurveyNumber()).isEqualTo("SY-101/2A");
		assertThat(saved.getAreaAcres()).isEqualTo(5.5);
		assertThat(saved.getSoilType()).isEqualTo("Black");
		assertThat(saved.getIrrigationSource()).isEqualTo("Borewell");
		assertThat(saved.getOwnershipType()).isEqualTo("Owned");
		assertThat(saved.getStatus()).isEqualTo(Status.AC);
	}

	@Test
	void createDoesNotSetIdFromDto() {
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		ArgumentCaptor<LandHolding> captor = ArgumentCaptor.forClass(LandHolding.class);
		dto.setHoldingId(999);

		landHoldingService.create(dto);

		verify(landHoldingRepository).save(captor.capture());
		assertThat(captor.getValue().getHoldingId()).isNull();
	}

	@Test
	void updateLoadsExistingThenSaves() {
		when(landHoldingRepository.findById(1)).thenReturn(Optional.of(landHolding));
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);

		landHoldingService.update(1, dto);

		verify(landHoldingRepository).findById(1);
		verify(landHoldingRepository).save(landHolding);
	}

	@Test
	void updateChangesAreaField() {
		when(landHoldingRepository.findById(1)).thenReturn(Optional.of(landHolding));
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		dto.setAreaAcres(20.0);

		landHoldingService.update(1, dto);

		assertThat(landHolding.getAreaAcres()).isEqualTo(20.0);
	}

	@Test
	void updateChangesSoilTypeField() {
		when(landHoldingRepository.findById(1)).thenReturn(Optional.of(landHolding));
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		dto.setSoilType("Red");

		landHoldingService.update(1, dto);

		assertThat(landHolding.getSoilType()).isEqualTo("Red");
	}

	@Test
	void updateChangesIrrigationSourceField() {
		when(landHoldingRepository.findById(1)).thenReturn(Optional.of(landHolding));
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		dto.setIrrigationSource("Canal");

		landHoldingService.update(1, dto);

		assertThat(landHolding.getIrrigationSource()).isEqualTo("Canal");
	}

	@Test
	void updateChangesOwnershipTypeField() {
		when(landHoldingRepository.findById(1)).thenReturn(Optional.of(landHolding));
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		dto.setOwnershipType("Leased");

		landHoldingService.update(1, dto);

		assertThat(landHolding.getOwnershipType()).isEqualTo("Leased");
	}

	@Test
	void updateChangesStatusField() {
		when(landHoldingRepository.findById(1)).thenReturn(Optional.of(landHolding));
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		dto.setStatus(Status.IN);

		landHoldingService.update(1, dto);

		assertThat(landHolding.getStatus()).isEqualTo(Status.IN);
	}

	@Test
	void updateChangesSurveyNumberField() {
		when(landHoldingRepository.findById(1)).thenReturn(Optional.of(landHolding));
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		dto.setSurveyNumber("SY-999");

		landHoldingService.update(1, dto);

		assertThat(landHolding.getSurveyNumber()).isEqualTo("SY-999");
	}

	@Test
	void updateChangesFarmerIdField() {
		when(landHoldingRepository.findById(1)).thenReturn(Optional.of(landHolding));
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		dto.setFarmerId(55);

		landHoldingService.update(1, dto);

		assertThat(landHolding.getFarmerId()).isEqualTo(55);
	}

	@Test
	void updateThrowsWhenMissing() {
		when(landHoldingRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> landHoldingService.update(99, dto))
				.isInstanceOf(EntityNotFoundException.class);
		verify(landHoldingRepository, never()).save(any(LandHolding.class));
	}

	@Test
	void deleteLoadsThenDeletes() {
		when(landHoldingRepository.findById(1)).thenReturn(Optional.of(landHolding));

		landHoldingService.delete(1);

		verify(landHoldingRepository).findById(1);
		verify(landHoldingRepository, times(1)).delete(landHolding);
	}

	@Test
	void deleteThrowsWhenMissing() {
		when(landHoldingRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> landHoldingService.delete(99))
				.isInstanceOf(EntityNotFoundException.class);
		verify(landHoldingRepository, never()).delete(any(LandHolding.class));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 5, 10, 100, 9999})
	void getByIdWithVariousIds(int id) {
		LandHolding h = LandHolding.builder().holdingId(id).surveyNumber("X").build();
		when(landHoldingRepository.findById(id)).thenReturn(Optional.of(h));

		assertThat(landHoldingService.getById(id).getHoldingId()).isEqualTo(id);
	}

	@ParameterizedTest
	@ValueSource(ints = {0, 50, 99, 1000, 123456})
	void getByIdThrowsForVariousMissingIds(int id) {
		when(landHoldingRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> landHoldingService.getById(id))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessageContaining(String.valueOf(id));
	}

	@ParameterizedTest
	@ValueSource(strings = {"Black", "Red", "Alluvial", "Laterite", "Clay", "Sandy"})
	void createWithVariousSoilTypes(String soilType) {
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		ArgumentCaptor<LandHolding> captor = ArgumentCaptor.forClass(LandHolding.class);
		dto.setSoilType(soilType);

		landHoldingService.create(dto);

		verify(landHoldingRepository).save(captor.capture());
		assertThat(captor.getValue().getSoilType()).isEqualTo(soilType);
	}

	@ParameterizedTest
	@ValueSource(strings = {"Borewell", "Canal", "Rainfed", "Well", "Tank"})
	void createWithVariousIrrigationSources(String irrigation) {
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		ArgumentCaptor<LandHolding> captor = ArgumentCaptor.forClass(LandHolding.class);
		dto.setIrrigationSource(irrigation);

		landHoldingService.create(dto);

		verify(landHoldingRepository).save(captor.capture());
		assertThat(captor.getValue().getIrrigationSource()).isEqualTo(irrigation);
	}

	@ParameterizedTest
	@ValueSource(strings = {"Owned", "Leased", "Rented", "Shared", "Inherited"})
	void createWithVariousOwnershipTypes(String ownership) {
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		ArgumentCaptor<LandHolding> captor = ArgumentCaptor.forClass(LandHolding.class);
		dto.setOwnershipType(ownership);

		landHoldingService.create(dto);

		verify(landHoldingRepository).save(captor.capture());
		assertThat(captor.getValue().getOwnershipType()).isEqualTo(ownership);
	}

	@ParameterizedTest
	@ValueSource(doubles = {0.0, -1.0, 0.5, 100.0, 9999.99, 1000000.0})
	void createWithBoundaryAreaAcres(double area) {
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		ArgumentCaptor<LandHolding> captor = ArgumentCaptor.forClass(LandHolding.class);
		dto.setAreaAcres(area);

		landHoldingService.create(dto);

		verify(landHoldingRepository).save(captor.capture());
		assertThat(captor.getValue().getAreaAcres()).isEqualTo(area);
	}

	@ParameterizedTest
	@NullAndEmptySource
	@ValueSource(strings = {"   "})
	void createWithBlankOrNullSurveyNumber(String surveyNumber) {
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		ArgumentCaptor<LandHolding> captor = ArgumentCaptor.forClass(LandHolding.class);
		dto.setSurveyNumber(surveyNumber);

		landHoldingService.create(dto);

		verify(landHoldingRepository).save(captor.capture());
		assertThat(captor.getValue().getSurveyNumber()).isEqualTo(surveyNumber);
	}

	@ParameterizedTest
	@CsvSource({
			"1, SY-1, 2.0",
			"2, SY-2, 4.5",
			"3, SY-3, 10.0",
			"4, SY-4, 0.25"
	})
	void createWithVariousData(Integer farmerId, String surveyNumber, Double area) {
		when(landHoldingRepository.save(any(LandHolding.class))).thenReturn(landHolding);
		ArgumentCaptor<LandHolding> captor = ArgumentCaptor.forClass(LandHolding.class);
		dto.setFarmerId(farmerId);
		dto.setSurveyNumber(surveyNumber);
		dto.setAreaAcres(area);

		landHoldingService.create(dto);

		verify(landHoldingRepository).save(captor.capture());
		assertThat(captor.getValue().getFarmerId()).isEqualTo(farmerId);
		assertThat(captor.getValue().getSurveyNumber()).isEqualTo(surveyNumber);
		assertThat(captor.getValue().getAreaAcres()).isEqualTo(area);
	}
}

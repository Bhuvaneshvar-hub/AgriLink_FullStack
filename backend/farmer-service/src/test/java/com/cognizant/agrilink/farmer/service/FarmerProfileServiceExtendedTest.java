package com.cognizant.agrilink.farmer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.cognizant.agrilink.farmer.dto.FarmerProfileDto;
import com.cognizant.agrilink.farmer.entity.FarmerProfile;
import com.cognizant.agrilink.farmer.enums.Status;
import com.cognizant.agrilink.farmer.repository.FarmerProfileRepository;
import jakarta.persistence.EntityNotFoundException;
import java.time.LocalDate;
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
class FarmerProfileServiceExtendedTest {

	@Mock
	private FarmerProfileRepository farmerProfileRepository;

	@InjectMocks
	private FarmerProfileService farmerProfileService;

	private FarmerProfile farmerProfile;
	private FarmerProfileDto dto;

	@BeforeEach
	void setUp() {
		farmerProfile = FarmerProfile.builder()
				.farmerId(1)
				.userId(1)
				.name("Ramesh Kumar")
				.dateOfBirth(LocalDate.of(1985, 4, 12))
				.gender("Male")
				.nationalIdNumber("ABCD1234")
				.village("Kovilpatti")
				.district("Thoothukudi")
				.state("Tamil Nadu")
				.phone("9876543210")
				.bankAccountNumber("1234567890")
				.status(Status.AC)
				.build();
		dto = FarmerProfileDto.builder()
				.userId(1)
				.name("Ramesh Kumar")
				.dateOfBirth(LocalDate.of(1985, 4, 12))
				.gender("Male")
				.nationalIdNumber("ABCD1234")
				.village("Kovilpatti")
				.district("Thoothukudi")
				.state("Tamil Nadu")
				.phone("9876543210")
				.bankAccountNumber("1234567890")
				.status(Status.AC)
				.build();
	}

	@Test
	void getAllReturnsEmptyList() {
		when(farmerProfileRepository.findAll()).thenReturn(List.of());

		assertThat(farmerProfileService.getAll()).isEmpty();
		verify(farmerProfileRepository).findAll();
	}

	@Test
	void getAllReturnsManyRecords() {
		when(farmerProfileRepository.findAll()).thenReturn(List.of(farmerProfile, farmerProfile, farmerProfile));

		assertThat(farmerProfileService.getAll()).hasSize(3);
	}

	@Test
	void getByIdReturnsCorrectVillage() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));

		assertThat(farmerProfileService.getById(1).getVillage()).isEqualTo("Kovilpatti");
	}

	@Test
	void getByIdThrowsWithMessage() {
		when(farmerProfileRepository.findById(42)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> farmerProfileService.getById(42))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessageContaining("FarmerProfile not found with id 42");
	}

	@Test
	void createReturnsSavedEntity() {
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);

		FarmerProfile result = farmerProfileService.create(dto);

		assertThat(result.getName()).isEqualTo("Ramesh Kumar");
	}

	@Test
	void createMapsAllFields() {
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		ArgumentCaptor<FarmerProfile> captor = ArgumentCaptor.forClass(FarmerProfile.class);

		farmerProfileService.create(dto);

		verify(farmerProfileRepository).save(captor.capture());
		FarmerProfile saved = captor.getValue();
		assertThat(saved.getUserId()).isEqualTo(1);
		assertThat(saved.getName()).isEqualTo("Ramesh Kumar");
		assertThat(saved.getDateOfBirth()).isEqualTo(LocalDate.of(1985, 4, 12));
		assertThat(saved.getGender()).isEqualTo("Male");
		assertThat(saved.getNationalIdNumber()).isEqualTo("ABCD1234");
		assertThat(saved.getVillage()).isEqualTo("Kovilpatti");
		assertThat(saved.getDistrict()).isEqualTo("Thoothukudi");
		assertThat(saved.getState()).isEqualTo("Tamil Nadu");
		assertThat(saved.getPhone()).isEqualTo("9876543210");
		assertThat(saved.getBankAccountNumber()).isEqualTo("1234567890");
		assertThat(saved.getStatus()).isEqualTo(Status.AC);
	}

	@Test
	void createDoesNotSetIdFromDto() {
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		ArgumentCaptor<FarmerProfile> captor = ArgumentCaptor.forClass(FarmerProfile.class);
		dto.setFarmerId(999);

		farmerProfileService.create(dto);

		verify(farmerProfileRepository).save(captor.capture());
		assertThat(captor.getValue().getFarmerId()).isNull();
	}

	@Test
	void updateLoadsExistingThenSaves() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);

		farmerProfileService.update(1, dto);

		verify(farmerProfileRepository).findById(1);
		verify(farmerProfileRepository).save(farmerProfile);
	}

	@Test
	void updateChangesNameField() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		dto.setName("New Name");

		farmerProfileService.update(1, dto);

		assertThat(farmerProfile.getName()).isEqualTo("New Name");
	}

	@Test
	void updateChangesStatusField() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		dto.setStatus(Status.IN);

		farmerProfileService.update(1, dto);

		assertThat(farmerProfile.getStatus()).isEqualTo(Status.IN);
	}

	@Test
	void updateChangesPhoneField() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		dto.setPhone("9000000000");

		farmerProfileService.update(1, dto);

		assertThat(farmerProfile.getPhone()).isEqualTo("9000000000");
	}

	@Test
	void updateChangesVillageField() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		dto.setVillage("Madurai");

		farmerProfileService.update(1, dto);

		assertThat(farmerProfile.getVillage()).isEqualTo("Madurai");
	}

	@Test
	void updateChangesDistrictField() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		dto.setDistrict("Salem");

		farmerProfileService.update(1, dto);

		assertThat(farmerProfile.getDistrict()).isEqualTo("Salem");
	}

	@Test
	void updateChangesStateField() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		dto.setState("Kerala");

		farmerProfileService.update(1, dto);

		assertThat(farmerProfile.getState()).isEqualTo("Kerala");
	}

	@Test
	void updateChangesGenderField() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		dto.setGender("Female");

		farmerProfileService.update(1, dto);

		assertThat(farmerProfile.getGender()).isEqualTo("Female");
	}

	@Test
	void updateChangesDateOfBirthField() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		dto.setDateOfBirth(LocalDate.of(1990, 1, 1));

		farmerProfileService.update(1, dto);

		assertThat(farmerProfile.getDateOfBirth()).isEqualTo(LocalDate.of(1990, 1, 1));
	}

	@Test
	void updateChangesNationalIdField() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		dto.setNationalIdNumber("ZZZZ9999");

		farmerProfileService.update(1, dto);

		assertThat(farmerProfile.getNationalIdNumber()).isEqualTo("ZZZZ9999");
	}

	@Test
	void updateChangesBankAccountField() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		dto.setBankAccountNumber("9999888877");

		farmerProfileService.update(1, dto);

		assertThat(farmerProfile.getBankAccountNumber()).isEqualTo("9999888877");
	}

	@Test
	void updateChangesUserIdField() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		dto.setUserId(77);

		farmerProfileService.update(1, dto);

		assertThat(farmerProfile.getUserId()).isEqualTo(77);
	}

	@Test
	void updateThrowsWhenMissing() {
		when(farmerProfileRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> farmerProfileService.update(99, dto))
				.isInstanceOf(EntityNotFoundException.class);
		verify(farmerProfileRepository, never()).save(any(FarmerProfile.class));
	}

	@Test
	void deleteLoadsThenDeletes() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));

		farmerProfileService.delete(1);

		verify(farmerProfileRepository).findById(1);
		verify(farmerProfileRepository, times(1)).delete(farmerProfile);
	}

	@Test
	void deleteThrowsWhenMissing() {
		when(farmerProfileRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> farmerProfileService.delete(99))
				.isInstanceOf(EntityNotFoundException.class);
		verify(farmerProfileRepository, never()).delete(any(FarmerProfile.class));
	}

	@ParameterizedTest
	@ValueSource(ints = {1, 2, 5, 10, 100, 9999})
	void getByIdWithVariousIds(int id) {
		FarmerProfile p = FarmerProfile.builder().farmerId(id).name("X").build();
		when(farmerProfileRepository.findById(id)).thenReturn(Optional.of(p));

		assertThat(farmerProfileService.getById(id).getFarmerId()).isEqualTo(id);
	}

	@ParameterizedTest
	@ValueSource(ints = {0, 50, 99, 1000, 123456})
	void getByIdThrowsForVariousMissingIds(int id) {
		when(farmerProfileRepository.findById(id)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> farmerProfileService.getById(id))
				.isInstanceOf(EntityNotFoundException.class)
				.hasMessageContaining(String.valueOf(id));
	}

	@ParameterizedTest
	@ValueSource(strings = {"AC", "IN"})
	void createWithVariousStatuses(Status status) {
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		ArgumentCaptor<FarmerProfile> captor = ArgumentCaptor.forClass(FarmerProfile.class);
		dto.setStatus(status);

		farmerProfileService.create(dto);

		verify(farmerProfileRepository).save(captor.capture());
		assertThat(captor.getValue().getStatus()).isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(strings = {"Male", "Female", "Other"})
	void createWithVariousGenders(String gender) {
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		ArgumentCaptor<FarmerProfile> captor = ArgumentCaptor.forClass(FarmerProfile.class);
		dto.setGender(gender);

		farmerProfileService.create(dto);

		verify(farmerProfileRepository).save(captor.capture());
		assertThat(captor.getValue().getGender()).isEqualTo(gender);
	}

	@ParameterizedTest
	@NullAndEmptySource
	@ValueSource(strings = {"   "})
	void createWithBlankOrNullName(String name) {
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		ArgumentCaptor<FarmerProfile> captor = ArgumentCaptor.forClass(FarmerProfile.class);
		dto.setName(name);

		farmerProfileService.create(dto);

		verify(farmerProfileRepository).save(captor.capture());
		assertThat(captor.getValue().getName()).isEqualTo(name);
	}

	@ParameterizedTest
	@CsvSource({
			"1, Ramesh, Kovilpatti",
			"2, Suresh, Madurai",
			"3, Lakshmi, Salem",
			"4, Priya, Erode"
	})
	void createWithVariousData(Integer userId, String name, String village) {
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);
		ArgumentCaptor<FarmerProfile> captor = ArgumentCaptor.forClass(FarmerProfile.class);
		dto.setUserId(userId);
		dto.setName(name);
		dto.setVillage(village);

		farmerProfileService.create(dto);

		verify(farmerProfileRepository).save(captor.capture());
		assertThat(captor.getValue().getUserId()).isEqualTo(userId);
		assertThat(captor.getValue().getName()).isEqualTo(name);
		assertThat(captor.getValue().getVillage()).isEqualTo(village);
	}
}

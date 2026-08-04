package com.cognizant.agrilink.farmer.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
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
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FarmerProfileServiceTest {

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
	void getAllReturnsList() {
		when(farmerProfileRepository.findAll()).thenReturn(List.of(farmerProfile));

		assertThat(farmerProfileService.getAll()).hasSize(1);
		verify(farmerProfileRepository).findAll();
	}

	@Test
	void getByIdReturnsRecord() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));

		assertThat(farmerProfileService.getById(1).getName()).isEqualTo("Ramesh Kumar");
	}

	@Test
	void getByIdThrowsWhenMissing() {
		when(farmerProfileRepository.findById(99)).thenReturn(Optional.empty());

		assertThatThrownBy(() -> farmerProfileService.getById(99))
				.isInstanceOf(EntityNotFoundException.class);
	}

	@Test
	void createSavesRecord() {
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);

		farmerProfileService.create(dto);

		verify(farmerProfileRepository).save(any(FarmerProfile.class));
	}

	@Test
	void updateModifiesRecord() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);

		farmerProfileService.update(1, dto);

		verify(farmerProfileRepository).save(any(FarmerProfile.class));
	}

	@Test
	void deleteRemovesRecord() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));

		farmerProfileService.delete(1);

		verify(farmerProfileRepository, times(1)).delete(farmerProfile);
	}

	@Test
	void setStatusUpdatesStatus() {
		when(farmerProfileRepository.findById(1)).thenReturn(Optional.of(farmerProfile));
		when(farmerProfileRepository.save(any(FarmerProfile.class))).thenReturn(farmerProfile);

		farmerProfileService.setStatus(1, Status.VE);

		assertThat(farmerProfile.getStatus()).isEqualTo(Status.VE);
		verify(farmerProfileRepository).save(farmerProfile);
	}
}

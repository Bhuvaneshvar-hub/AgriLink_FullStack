package com.cognizant.agrilink.farmer.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.farmer.entity.FarmerProfile;
import com.cognizant.agrilink.farmer.enums.Status;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class FarmerProfileRepositoryTest {

	@Autowired
	private FarmerProfileRepository farmerProfileRepository;

	private FarmerProfile buildFarmerProfile() {
		return FarmerProfile.builder()
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
	void saveAndFindById() {
		FarmerProfile saved = farmerProfileRepository.save(buildFarmerProfile());

		FarmerProfile found = farmerProfileRepository.findById(saved.getFarmerId()).orElseThrow();

		assertThat(found.getName()).isEqualTo("Ramesh Kumar");
		assertThat(found.getVillage()).isEqualTo("Kovilpatti");
	}

	@Test
	void findAllReturnsSavedRecords() {
		farmerProfileRepository.save(buildFarmerProfile());
		FarmerProfile second = buildFarmerProfile();
		second.setNationalIdNumber("ABCD5678");
		farmerProfileRepository.save(second);

		assertThat(farmerProfileRepository.findAll()).hasSize(2);
	}

	@Test
	void deleteRemovesRecord() {
		FarmerProfile saved = farmerProfileRepository.save(buildFarmerProfile());

		farmerProfileRepository.deleteById(saved.getFarmerId());

		assertThat(farmerProfileRepository.findById(saved.getFarmerId())).isEmpty();
	}
}

package com.cognizant.agrilink.farmer.repository;

import static org.assertj.core.api.Assertions.assertThat;

import com.cognizant.agrilink.farmer.entity.FarmerProfile;
import com.cognizant.agrilink.farmer.enums.Status;
import java.time.LocalDate;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

@DataJpaTest
class FarmerProfileRepositoryExtendedTest {

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

	private FarmerProfile buildFarmerProfile(String nationalIdNumber) {
		FarmerProfile profile = buildFarmerProfile();
		profile.setNationalIdNumber(nationalIdNumber);
		return profile;
	}

	@Test
	void saveAssignsGeneratedId() {
		FarmerProfile saved = farmerProfileRepository.save(buildFarmerProfile());

		assertThat(saved.getFarmerId()).isNotNull();
	}

	@Test
	void findAllEmptyInitially() {
		assertThat(farmerProfileRepository.findAll()).isEmpty();
	}

	@Test
	void countReturnsZeroInitially() {
		assertThat(farmerProfileRepository.count()).isZero();
	}

	@Test
	void countReflectsSavedRecords() {
		farmerProfileRepository.save(buildFarmerProfile("ABCD0001"));
		farmerProfileRepository.save(buildFarmerProfile("ABCD0002"));
		farmerProfileRepository.save(buildFarmerProfile("ABCD0003"));

		assertThat(farmerProfileRepository.count()).isEqualTo(3);
	}

	@Test
	void existsByIdReturnsTrueWhenPresent() {
		FarmerProfile saved = farmerProfileRepository.save(buildFarmerProfile());

		assertThat(farmerProfileRepository.existsById(saved.getFarmerId())).isTrue();
	}

	@Test
	void existsByIdReturnsFalseWhenAbsent() {
		assertThat(farmerProfileRepository.existsById(9999)).isFalse();
	}

	@Test
	void findByIdEmptyWhenAbsent() {
		assertThat(farmerProfileRepository.findById(9999)).isEmpty();
	}

	@Test
	void saveManyAndFindAll() {
		for (int i = 0; i < 5; i++) {
			farmerProfileRepository.save(buildFarmerProfile("ABCD100" + i));
		}

		assertThat(farmerProfileRepository.findAll()).hasSize(5);
	}

	@Test
	void deleteThenVerifyGone() {
		FarmerProfile saved = farmerProfileRepository.save(buildFarmerProfile());

		farmerProfileRepository.delete(saved);

		assertThat(farmerProfileRepository.findById(saved.getFarmerId())).isEmpty();
	}

	@Test
	void deleteAllRemovesEverything() {
		farmerProfileRepository.save(buildFarmerProfile("ABCD0001"));
		farmerProfileRepository.save(buildFarmerProfile("ABCD0002"));

		farmerProfileRepository.deleteAll();

		assertThat(farmerProfileRepository.findAll()).isEmpty();
	}

	@Test
	void updateNamePersists() {
		FarmerProfile saved = farmerProfileRepository.save(buildFarmerProfile());

		saved.setName("Updated Name");
		farmerProfileRepository.save(saved);

		FarmerProfile found = farmerProfileRepository.findById(saved.getFarmerId()).orElseThrow();
		assertThat(found.getName()).isEqualTo("Updated Name");
	}

	@Test
	void updateStatusPersists() {
		FarmerProfile saved = farmerProfileRepository.save(buildFarmerProfile());

		saved.setStatus(Status.IN);
		farmerProfileRepository.save(saved);

		FarmerProfile found = farmerProfileRepository.findById(saved.getFarmerId()).orElseThrow();
		assertThat(found.getStatus()).isEqualTo(Status.IN);
	}

	@Test
	void updatePhonePersists() {
		FarmerProfile saved = farmerProfileRepository.save(buildFarmerProfile());

		saved.setPhone("9000000000");
		farmerProfileRepository.save(saved);

		FarmerProfile found = farmerProfileRepository.findById(saved.getFarmerId()).orElseThrow();
		assertThat(found.getPhone()).isEqualTo("9000000000");
	}

	@Test
	void savedRecordRetainsAllFields() {
		FarmerProfile saved = farmerProfileRepository.save(buildFarmerProfile());

		FarmerProfile found = farmerProfileRepository.findById(saved.getFarmerId()).orElseThrow();
		assertThat(found.getUserId()).isEqualTo(1);
		assertThat(found.getDateOfBirth()).isEqualTo(LocalDate.of(1985, 4, 12));
		assertThat(found.getGender()).isEqualTo("Male");
		assertThat(found.getNationalIdNumber()).isEqualTo("ABCD1234");
		assertThat(found.getDistrict()).isEqualTo("Thoothukudi");
		assertThat(found.getState()).isEqualTo("Tamil Nadu");
		assertThat(found.getBankAccountNumber()).isEqualTo("1234567890");
	}

	@ParameterizedTest
	@ValueSource(strings = {"AC", "IN"})
	void saveWithVariousStatuses(Status status) {
		FarmerProfile profile = buildFarmerProfile();
		profile.setStatus(status);

		FarmerProfile saved = farmerProfileRepository.save(profile);

		assertThat(farmerProfileRepository.findById(saved.getFarmerId()).orElseThrow().getStatus())
				.isEqualTo(status);
	}

	@ParameterizedTest
	@ValueSource(strings = {"Male", "Female", "Other", "Transgender"})
	void saveWithVariousGenders(String gender) {
		FarmerProfile profile = buildFarmerProfile();
		profile.setGender(gender);

		FarmerProfile saved = farmerProfileRepository.save(profile);

		assertThat(farmerProfileRepository.findById(saved.getFarmerId()).orElseThrow().getGender())
				.isEqualTo(gender);
	}

	@ParameterizedTest
	@NullAndEmptySource
	@ValueSource(strings = {"   "})
	void saveWithBlankOrNullName(String name) {
		FarmerProfile profile = buildFarmerProfile();
		profile.setName(name);

		FarmerProfile saved = farmerProfileRepository.save(profile);

		assertThat(farmerProfileRepository.findById(saved.getFarmerId()).orElseThrow().getName())
				.isEqualTo(name);
	}

	@ParameterizedTest
	@CsvSource({
			"1, Ramesh, Kovilpatti",
			"2, Suresh, Madurai",
			"3, Lakshmi, Salem",
			"4, Priya, Erode",
			"5, Karthik, Trichy"
	})
	void saveWithVariousUserData(Integer userId, String name, String village) {
		FarmerProfile profile = buildFarmerProfile();
		profile.setUserId(userId);
		profile.setName(name);
		profile.setVillage(village);

		FarmerProfile saved = farmerProfileRepository.save(profile);

		FarmerProfile found = farmerProfileRepository.findById(saved.getFarmerId()).orElseThrow();
		assertThat(found.getUserId()).isEqualTo(userId);
		assertThat(found.getName()).isEqualTo(name);
		assertThat(found.getVillage()).isEqualTo(village);
	}

	@ParameterizedTest
	@CsvSource({
			"1980-01-01",
			"1995-12-31",
			"2000-06-15",
			"1970-03-25",
			"2005-09-09"
	})
	void saveWithVariousDates(String date) {
		FarmerProfile profile = buildFarmerProfile();
		profile.setDateOfBirth(LocalDate.parse(date));

		FarmerProfile saved = farmerProfileRepository.save(profile);

		assertThat(farmerProfileRepository.findById(saved.getFarmerId()).orElseThrow().getDateOfBirth())
				.isEqualTo(LocalDate.parse(date));
	}

	@Test
	void saveAllPersistsMultiple() {
		farmerProfileRepository.saveAll(List.of(buildFarmerProfile("ABCD0001"), buildFarmerProfile("ABCD0002")));

		assertThat(farmerProfileRepository.count()).isEqualTo(2);
	}
}

package com.cognizant.agrilink.farmer.service;

import com.cognizant.agrilink.farmer.dto.FarmerProfileDto;
import com.cognizant.agrilink.farmer.entity.FarmerProfile;
import com.cognizant.agrilink.farmer.enums.Status;
import com.cognizant.agrilink.farmer.repository.FarmerProfileRepository;
import com.cognizant.agrilink.farmer.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class FarmerProfileService {

	private final FarmerProfileRepository farmerProfileRepository;

	public FarmerProfileService(FarmerProfileRepository farmerProfileRepository) {
		this.farmerProfileRepository = farmerProfileRepository;
	}

	public List<FarmerProfile> getAll() {
		return farmerProfileRepository.findAll();
	}

	public List<FarmerProfile> getByUserId(Integer userId) {
		return farmerProfileRepository.findByUserId(userId);
	}

	public FarmerProfile getById(Integer id) {
		return farmerProfileRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("FarmerProfile not found with id " + id));
	}

	public FarmerProfile create(FarmerProfileDto dto) {
		if (dto.getNationalIdNumber() != null
				&& farmerProfileRepository.existsByNationalIdNumber(dto.getNationalIdNumber())) {
			throw new IllegalStateException(
					"A farmer profile already exists with national ID " + dto.getNationalIdNumber());
		}
		FarmerProfile farmerProfile = FarmerProfile.builder()
				.userId(dto.getUserId())
				.name(dto.getName())
				.dateOfBirth(dto.getDateOfBirth())
				.gender(dto.getGender())
				.nationalIdNumber(dto.getNationalIdNumber())
				.village(dto.getVillage())
				.district(dto.getDistrict())
				.state(dto.getState())
				.phone(dto.getPhone())
				.bankAccountNumber(dto.getBankAccountNumber())
				.status(dto.getStatus() != null ? dto.getStatus() : Status.AC)
				.build();
		return farmerProfileRepository.save(farmerProfile);
	}

	public FarmerProfile update(Integer id, FarmerProfileDto dto) {
		FarmerProfile farmerProfile = getById(id);
		if (dto.getNationalIdNumber() != null
				&& farmerProfileRepository.existsByNationalIdNumberAndFarmerIdNot(
						dto.getNationalIdNumber(), id)) {
			throw new IllegalStateException(
					"A farmer profile already exists with national ID " + dto.getNationalIdNumber());
		}
		farmerProfile.setUserId(dto.getUserId());
		farmerProfile.setName(dto.getName());
		farmerProfile.setDateOfBirth(dto.getDateOfBirth());
		farmerProfile.setGender(dto.getGender());
		farmerProfile.setNationalIdNumber(dto.getNationalIdNumber());
		farmerProfile.setVillage(dto.getVillage());
		farmerProfile.setDistrict(dto.getDistrict());
		farmerProfile.setState(dto.getState());
		farmerProfile.setPhone(dto.getPhone());
		farmerProfile.setBankAccountNumber(dto.getBankAccountNumber());
		farmerProfile.setStatus(dto.getStatus());
		return farmerProfileRepository.save(farmerProfile);
	}

	public void delete(Integer id) {
		FarmerProfile farmerProfile = getById(id);
		farmerProfileRepository.delete(farmerProfile);
	}
}

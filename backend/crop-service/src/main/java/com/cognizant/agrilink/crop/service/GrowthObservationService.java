package com.cognizant.agrilink.crop.service;

import com.cognizant.agrilink.crop.dto.GrowthObservationDto;
import com.cognizant.agrilink.crop.entity.GrowthObservation;
import com.cognizant.agrilink.crop.enums.Stage;
import com.cognizant.agrilink.crop.repository.GrowthObservationRepository;
import com.cognizant.agrilink.crop.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class GrowthObservationService {

	private final GrowthObservationRepository growthObservationRepository;

	public GrowthObservationService(GrowthObservationRepository growthObservationRepository) {
		this.growthObservationRepository = growthObservationRepository;
	}

	public List<GrowthObservation> getAll() {
		return growthObservationRepository.findAll();
	}

	public List<GrowthObservation> getByPlanIds(List<Integer> planIds) {
		if (planIds == null || planIds.isEmpty()) {
			return List.of();
		}
		return growthObservationRepository.findByPlanIdIn(planIds);
	}

	public GrowthObservation getById(Integer id) {
		return growthObservationRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("GrowthObservation not found with id " + id));
	}

	public GrowthObservation create(GrowthObservationDto dto) {
		validateStageTransition(dto.getPlanId(), dto.getStage());
		GrowthObservation growthObservation = GrowthObservation.builder()
				.planId(dto.getPlanId())
				.officerId(dto.getOfficerId())
				.observationDate(dto.getObservationDate())
				.stage(dto.getStage())
				.pestOrDiseaseFlag(dto.getPestOrDiseaseFlag())
				.remarks(dto.getRemarks())
				.build();
		return growthObservationRepository.save(growthObservation);
	}

	public GrowthObservation update(Integer id, GrowthObservationDto dto) {
		GrowthObservation growthObservation = getById(id);
		growthObservation.setPlanId(dto.getPlanId());
		growthObservation.setOfficerId(dto.getOfficerId());
		growthObservation.setObservationDate(dto.getObservationDate());
		growthObservation.setStage(dto.getStage());
		growthObservation.setPestOrDiseaseFlag(dto.getPestOrDiseaseFlag());
		growthObservation.setRemarks(dto.getRemarks());
		return growthObservationRepository.save(growthObservation);
	}

	public void delete(Integer id) {
		GrowthObservation growthObservation = getById(id);
		growthObservationRepository.delete(growthObservation);
	}

	/**
	 * Enforces a strict forward-only growth flow
	 * (GERMINATION -> VEGETATIVE -> FLOWERING -> MATURITY) for a plan.
	 *
	 * <p>The current stage is the maximum {@link Stage#ordinal()} among existing
	 * observations for the plan. If none exist, the first observation must be
	 * {@code GERMINATION}. Otherwise the new stage's ordinal must equal the current
	 * stage or exactly one step ahead; anything else (skipping ahead or moving
	 * backward) is rejected with an {@link IllegalStateException} (mapped to HTTP 409).</p>
	 */
	private void validateStageTransition(Integer planId, Stage newStage) {
		if (newStage == null) {
			throw new IllegalStateException("Observation stage must be provided");
		}
		List<GrowthObservation> existing = growthObservationRepository.findByPlanId(planId);
		Stage current = null;
		for (GrowthObservation observation : existing) {
			Stage stage = observation.getStage();
			if (stage != null && (current == null || stage.ordinal() > current.ordinal())) {
				current = stage;
			}
		}
		if (current == null) {
			if (newStage != Stage.GERMINATION) {
				throw new IllegalStateException(
						"First observation must be at the Germination stage");
			}
			return;
		}
		if (newStage.ordinal() != current.ordinal() && newStage.ordinal() != current.ordinal() + 1) {
			throw new IllegalStateException(
					"Invalid stage transition: cannot go from " + current + " to " + newStage);
		}
	}
}

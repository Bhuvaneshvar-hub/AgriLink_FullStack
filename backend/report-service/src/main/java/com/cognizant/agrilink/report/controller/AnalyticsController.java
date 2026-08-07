package com.cognizant.agrilink.report.controller;

import com.cognizant.agrilink.report.service.AnalyticsService;
import java.util.List;
import java.util.Map;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class AnalyticsController {

	private final AnalyticsService analyticsService;

	// ── DASHBOARD ENDPOINTS ──────────────────────────────────────────────

	@GetMapping("/dashboard/cropCoverage")
	public ResponseEntity<List<Map<String, Object>>> getCropCoverage() {
		return ResponseEntity.ok(analyticsService.getCropCoverage());
	}

	@GetMapping("/dashboard/yieldEstimate")
	public ResponseEntity<List<Map<String, Object>>> getYieldEstimate() {
		return ResponseEntity.ok(analyticsService.getYieldEstimate());
	}

	@GetMapping("/dashboard/harvestVolume")
	public ResponseEntity<List<Map<String, Object>>> getHarvestVolume() {
		return ResponseEntity.ok(analyticsService.getHarvestVolume());
	}

	@GetMapping("/dashboard/subsidyUtilisation")
	public ResponseEntity<List<Map<String, Object>>> getSubsidyUtilisation() {
		return ResponseEntity.ok(analyticsService.getSubsidyUtilisation());
	}

	@GetMapping("/dashboard/inputDeliveryRate")
	public ResponseEntity<Map<String, Object>> getInputDeliveryRate() {
		return ResponseEntity.ok(analyticsService.getInputDeliveryRate());
	}

	@GetMapping("/dashboard/produceSalesSummary")
	public ResponseEntity<Map<String, Object>> getProduceSalesSummary() {
		return ResponseEntity.ok(analyticsService.getProduceSalesSummary());
	}

	// ── FARMERS ANALYTICS ENDPOINTS ──────────────────────────────────────

	@GetMapping("/farmers/registrationSummary")
	public ResponseEntity<List<Map<String, Object>>> getRegistrationSummary() {
		return ResponseEntity.ok(analyticsService.getRegistrationSummary());
	}

	@GetMapping("/farmers/landHoldingsSummary")
	public ResponseEntity<List<Map<String, Object>>> getLandHoldingsSummary() {
		return ResponseEntity.ok(analyticsService.getLandHoldingsSummary());
	}

	@GetMapping("/farmers/cropHistory/{farmerId}")
	public ResponseEntity<List<Map<String, Object>>> getCropHistory(@PathVariable Integer farmerId) {
		return ResponseEntity.ok(analyticsService.getCropHistory(farmerId));
	}

	// ── SUBSIDY ANALYTICS ENDPOINTS ──────────────────────────────────────

	@GetMapping("/subsidy/utilisationByScheme")
	public ResponseEntity<List<Map<String, Object>>> getUtilisationByScheme() {
		return ResponseEntity.ok(analyticsService.getUtilisationByScheme());
	}

	@GetMapping("/subsidy/disbursementTrend")
	public ResponseEntity<List<Map<String, Object>>> getDisbursementTrend() {
		return ResponseEntity.ok(analyticsService.getDisbursementTrend());
	}

	@GetMapping("/produce/salesTrend")
	public ResponseEntity<List<Map<String, Object>>> getSalesTrend() {
		return ResponseEntity.ok(analyticsService.getSalesTrend());
	}

	@GetMapping("/subsidy/eligibilityDistribution")
	public ResponseEntity<List<Map<String, Object>>> getEligibilityDistribution() {
		return ResponseEntity.ok(analyticsService.getEligibilityDistribution());
	}

	// ── PRODUCE ANALYTICS ENDPOINTS ──────────────────────────────────────

	@GetMapping("/produce/salesByRegion")
	public ResponseEntity<List<Map<String, Object>>> getSalesByRegion() {
		return ResponseEntity.ok(analyticsService.getSalesByRegion());
	}

	@GetMapping("/produce/priceDiscovery")
	public ResponseEntity<List<Map<String, Object>>> getPriceDiscovery() {
		return ResponseEntity.ok(analyticsService.getPriceDiscovery());
	}

	@GetMapping("/produce/qualityGradeDistribution")
	public ResponseEntity<List<Map<String, Object>>> getQualityGradeDistribution() {
		return ResponseEntity.ok(analyticsService.getQualityGradeDistribution());
	}
}

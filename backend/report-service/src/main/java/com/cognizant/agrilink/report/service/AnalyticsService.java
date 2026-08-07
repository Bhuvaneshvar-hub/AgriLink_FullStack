package com.cognizant.agrilink.report.service;

import com.cognizant.agrilink.report.dto.external.*;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

@Service
@RequiredArgsConstructor
@Slf4j
public class AnalyticsService {

	private final RestTemplate restTemplate;

	// ── EXTERNAL FETCH METHODS WITH RESILIENT FALLBACKS ──────────────────

	public List<CropPlanDto> getCropPlans() {
		try {
			return restTemplate.exchange(
					"http://crop-service/agrilink/crop/crop-plans",
					HttpMethod.GET, null,
					new ParameterizedTypeReference<List<CropPlanDto>>() {}
			).getBody();
		} catch (Exception e) {
			log.error("Failed to fetch crop plans: {}", e.getMessage());
			return List.of();
		}
	}

	public List<CropCatalogDto> getCropCatalogs() {
		try {
			return restTemplate.exchange(
					"http://crop-service/agrilink/crop/crop-catalogs",
					HttpMethod.GET, null,
					new ParameterizedTypeReference<List<CropCatalogDto>>() {}
			).getBody();
		} catch (Exception e) {
			log.error("Failed to fetch crop catalogs: {}", e.getMessage());
			return List.of();
		}
	}

	public List<FarmerProfileDto> getFarmerProfiles() {
		try {
			return restTemplate.exchange(
					"http://farmer-service/agrilink/farmer/farmer-profiles",
					HttpMethod.GET, null,
					new ParameterizedTypeReference<List<FarmerProfileDto>>() {}
			).getBody();
		} catch (Exception e) {
			log.error("Failed to fetch farmer profiles: {}", e.getMessage());
			return List.of();
		}
	}

	public List<LandHoldingDto> getLandHoldings() {
		try {
			return restTemplate.exchange(
					"http://farmer-service/agrilink/farmer/land-holdings",
					HttpMethod.GET, null,
					new ParameterizedTypeReference<List<LandHoldingDto>>() {}
			).getBody();
		} catch (Exception e) {
			log.error("Failed to fetch land holdings: {}", e.getMessage());
			return List.of();
		}
	}

	public List<InputRequestDto> getInputRequests() {
		try {
			return restTemplate.exchange(
					"http://input-service/agrilink/input/requests",
					HttpMethod.GET, null,
					new ParameterizedTypeReference<List<InputRequestDto>>() {}
			).getBody();
		} catch (Exception e) {
			log.error("Failed to fetch input requests: {}", e.getMessage());
			return List.of();
		}
	}

	public List<ProduceListingDto> getProduceListings() {
		try {
			return restTemplate.exchange(
					"http://produce-service/agrilink/produce/produce-listings",
					HttpMethod.GET, null,
					new ParameterizedTypeReference<List<ProduceListingDto>>() {}
			).getBody();
		} catch (Exception e) {
			log.error("Failed to fetch produce listings: {}", e.getMessage());
			return List.of();
		}
	}

	public List<ProduceSaleDto> getProduceSales() {
		try {
			return restTemplate.exchange(
					"http://produce-service/agrilink/produce/produce-sales",
					HttpMethod.GET, null,
					new ParameterizedTypeReference<List<ProduceSaleDto>>() {}
			).getBody();
		} catch (Exception e) {
			log.error("Failed to fetch produce sales: {}", e.getMessage());
			return List.of();
		}
	}

	public List<SubsidyApplicationDto> getSubsidyApplications() {
		try {
			return restTemplate.exchange(
					"http://subsidy-service/agriLink/subsidyScheme/fetchApplications",
					HttpMethod.GET, null,
					new ParameterizedTypeReference<List<SubsidyApplicationDto>>() {}
			).getBody();
		} catch (Exception e) {
			log.error("Failed to fetch subsidy applications: {}", e.getMessage());
			return List.of();
		}
	}

	public List<SchemeCatalogDto> getSchemeCatalogs() {
		try {
			return restTemplate.exchange(
					"http://subsidy-service/agriLink/subsidyScheme/fetchSchemes",
					HttpMethod.GET, null,
					new ParameterizedTypeReference<List<SchemeCatalogDto>>() {}
			).getBody();
		} catch (Exception e) {
			log.error("Failed to fetch scheme catalogs: {}", e.getMessage());
			return List.of();
		}
	}

	// ── ANALYTICS CALCULATIONS ───────────────────────────────────────────

	public List<Map<String, Object>> getCropCoverage() {
		List<CropPlanDto> plans = getCropPlans();
		List<FarmerProfileDto> profiles = getFarmerProfiles();

		Map<Integer, String> farmerRegionMap = profiles.stream()
				.filter(p -> p.getFarmerId() != null)
				.collect(Collectors.toMap(
						FarmerProfileDto::getFarmerId,
						p -> (p.getDistrict() != null ? p.getDistrict() : "Unknown") + ", " + 
						     (p.getState() != null ? p.getState() : "Unknown"),
						(v1, v2) -> v1
				));

		Map<String, Double> grouped = plans.stream()
				.filter(p -> p.getAreaPlanted() != null && p.getFarmerId() != null)
				.collect(Collectors.groupingBy(
						p -> farmerRegionMap.getOrDefault(p.getFarmerId(), "Unknown, Unknown") + "|" + p.getSeason(),
						Collectors.summingDouble(CropPlanDto::getAreaPlanted)
				));

		List<Map<String, Object>> result = new ArrayList<>();
		grouped.forEach((key, val) -> {
			String[] split = key.split("\\|");
			Map<String, Object> item = new HashMap<>();
			item.put("region", split[0]);
			item.put("season", split[1]);
			item.put("area", val);
			result.add(item);
		});
		return result;
	}

	public List<Map<String, Object>> getYieldEstimate() {
		List<CropPlanDto> plans = getCropPlans();
		List<ProduceListingDto> listings = getProduceListings();
		List<CropCatalogDto> crops = getCropCatalogs();

		Map<Integer, String> cropNameMap = crops.stream()
				.collect(Collectors.toMap(
						CropCatalogDto::getCropId,
						CropCatalogDto::getCropName,
						(v1, v2) -> v1
				));

		// Expected Yield = areaPlanted * 2500.0 kg/acre constant
		Map<Integer, Double> expectedGroup = plans.stream()
				.filter(p -> p.getAreaPlanted() != null && p.getCropId() != null)
				.collect(Collectors.groupingBy(
						CropPlanDto::getCropId,
						Collectors.summingDouble(p -> p.getAreaPlanted() * 2500.0)
				));

		// Actual Yield = ProduceListing quantity
		Map<Integer, Double> actualGroup = listings.stream()
				.filter(l -> l.getQuantityKg() != null && l.getCropId() != null)
				.collect(Collectors.groupingBy(
						ProduceListingDto::getCropId,
						Collectors.summingDouble(ProduceListingDto::getQuantityKg)
				));

		Set<Integer> allCropIds = new HashSet<>();
		allCropIds.addAll(expectedGroup.keySet());
		allCropIds.addAll(actualGroup.keySet());

		List<Map<String, Object>> result = new ArrayList<>();
		for (Integer cropId : allCropIds) {
			Map<String, Object> item = new HashMap<>();
			item.put("cropId", cropId);
			item.put("cropName", cropNameMap.getOrDefault(cropId, "Crop #" + cropId));
			item.put("expectedYield", expectedGroup.getOrDefault(cropId, 0.0));
			item.put("actualYield", actualGroup.getOrDefault(cropId, 0.0));
			result.add(item);
		}
		return result;
	}

	public List<Map<String, Object>> getHarvestVolume() {
		List<ProduceListingDto> listings = getProduceListings();

		Map<LocalDate, Double> grouped = listings.stream()
				.filter(l -> l.getHarvestDate() != null && l.getQuantityKg() != null)
				.collect(Collectors.groupingBy(
						ProduceListingDto::getHarvestDate,
						Collectors.summingDouble(ProduceListingDto::getQuantityKg)
				));

		return grouped.entrySet().stream()
				.sorted(Map.Entry.comparingByKey())
				.map(e -> {
					Map<String, Object> item = new HashMap<>();
					item.put("date", e.getKey().toString());
					item.put("volume", e.getValue());
					return item;
				})
				.collect(Collectors.toList());
	}

	public List<Map<String, Object>> getSubsidyUtilisation() {
		List<SubsidyApplicationDto> apps = getSubsidyApplications();
		List<SchemeCatalogDto> schemes = getSchemeCatalogs();

		Map<Integer, Double> utilisedGroup = apps.stream()
				.filter(a -> a.getSchemeId() != null && a.getDisbursedAmount() != null)
				.filter(a -> "Approved".equalsIgnoreCase(a.getStatus()) || "Disbursed".equalsIgnoreCase(a.getStatus()))
				.collect(Collectors.groupingBy(
						SubsidyApplicationDto::getSchemeId,
						Collectors.summingDouble(SubsidyApplicationDto::getDisbursedAmount)
				));

		Map<Integer, Long> countGroup = apps.stream()
				.filter(a -> a.getSchemeId() != null)
				.collect(Collectors.groupingBy(
						SubsidyApplicationDto::getSchemeId,
						Collectors.counting()
				));

		List<Map<String, Object>> result = new ArrayList<>();
		for (SchemeCatalogDto scheme : schemes) {
			Map<String, Object> item = new HashMap<>();
			Integer id = scheme.getSchemeId();
			item.put("schemeId", id);
			item.put("schemeName", scheme.getSchemeName());
			item.put("utilisedAmount", utilisedGroup.getOrDefault(id, 0.0));
			item.put("applicationCount", countGroup.getOrDefault(id, 0L));
			result.add(item);
		}
		return result;
	}

	public Map<String, Object> getInputDeliveryRate() {
		List<InputRequestDto> requests = getInputRequests();
		long total = requests.size();
		long fulfilled = requests.stream()
				.filter(r -> r.getStatus() != null && r.getStatus().toLowerCase().startsWith("fulfilled"))
				.count();

		double rate = total > 0 ? ((double) fulfilled / total) * 100.0 : 0.0;

		Map<String, Object> result = new HashMap<>();
		result.put("totalRequests", total);
		result.put("fulfilledRequests", fulfilled);
		result.put("deliveryFulfilmentRate", rate);
		return result;
	}

	public Map<String, Object> getProduceSalesSummary() {
		List<ProduceSaleDto> sales = getProduceSales();
		long count = sales.size();
		double totalValue = sales.stream()
				.filter(s -> s.getTotalAmount() != null)
				.mapToDouble(ProduceSaleDto::getTotalAmount)
				.sum();

		double avgPrice = sales.stream()
				.filter(s -> s.getAgreedPricePerKg() != null)
				.mapToDouble(ProduceSaleDto::getAgreedPricePerKg)
				.average()
				.orElse(0.0);

		Map<String, Object> result = new HashMap<>();
		result.put("totalSalesValue", totalValue);
		result.put("averagePrice", avgPrice);
		result.put("salesCount", count);
		return result;
	}

	public List<Map<String, Object>> getRegistrationSummary() {
		List<FarmerProfileDto> profiles = getFarmerProfiles();

		Map<String, Long> grouped = profiles.stream()
				.filter(p -> p.getState() != null && p.getDistrict() != null)
				.collect(Collectors.groupingBy(
						p -> p.getState() + "|" + p.getDistrict(),
						Collectors.counting()
				));

		List<Map<String, Object>> result = new ArrayList<>();
		grouped.forEach((key, val) -> {
			String[] split = key.split("\\|");
			Map<String, Object> item = new HashMap<>();
			item.put("state", split[0]);
			item.put("district", split[1]);
			item.put("farmerCount", val);
			result.add(item);
		});
		return result;
	}

	public List<Map<String, Object>> getLandHoldingsSummary() {
		List<LandHoldingDto> holdings = getLandHoldings();

		Map<String, Double> areaGroup = holdings.stream()
				.filter(h -> h.getSoilType() != null && h.getIrrigationSource() != null && h.getAreaAcres() != null)
				.collect(Collectors.groupingBy(
						h -> h.getSoilType() + "|" + h.getIrrigationSource(),
						Collectors.summingDouble(LandHoldingDto::getAreaAcres)
				));

		Map<String, Long> countGroup = holdings.stream()
				.filter(h -> h.getSoilType() != null && h.getIrrigationSource() != null)
				.collect(Collectors.groupingBy(
						h -> h.getSoilType() + "|" + h.getIrrigationSource(),
						Collectors.counting()
				));

		List<Map<String, Object>> result = new ArrayList<>();
		areaGroup.forEach((key, val) -> {
			String[] split = key.split("\\|");
			Map<String, Object> item = new HashMap<>();
			item.put("soilType", split[0]);
			item.put("irrigationSource", split[1]);
			item.put("totalAreaAcres", val);
			item.put("holdingCount", countGroup.getOrDefault(key, 0L));
			result.add(item);
		});
		return result;
	}

	public List<Map<String, Object>> getCropHistory(Integer farmerId) {
		List<CropPlanDto> plans = getCropPlans().stream()
				.filter(p -> farmerId.equals(p.getFarmerId()))
				.collect(Collectors.toList());
		List<ProduceListingDto> listings = getProduceListings().stream()
				.filter(l -> farmerId.equals(l.getFarmerId()))
				.collect(Collectors.toList());
		List<CropCatalogDto> crops = getCropCatalogs();

		Map<Integer, String> cropNameMap = crops.stream()
				.collect(Collectors.toMap(
						CropCatalogDto::getCropId,
						CropCatalogDto::getCropName,
						(v1, v2) -> v1
				));

		List<Map<String, Object>> result = new ArrayList<>();
		for (CropPlanDto plan : plans) {
			Map<String, Object> item = new HashMap<>();
			item.put("type", "Plan");
			item.put("planId", plan.getPlanId());
			item.put("cropName", cropNameMap.getOrDefault(plan.getCropId(), "Crop #" + plan.getCropId()));
			item.put("season", plan.getSeason());
			item.put("year", plan.getYear());
			item.put("areaPlanted", plan.getAreaPlanted());
			item.put("status", plan.getStatus());
			result.add(item);
		}
		for (ProduceListingDto listing : listings) {
			Map<String, Object> item = new HashMap<>();
			item.put("type", "Harvest");
			item.put("listingId", listing.getListingId());
			item.put("cropName", cropNameMap.getOrDefault(listing.getCropId(), "Crop #" + listing.getCropId()));
			item.put("harvestDate", listing.getHarvestDate());
			item.put("quantityKg", listing.getQuantityKg());
			item.put("qualityGrade", listing.getQualityGrade());
			item.put("status", listing.getStatus());
			result.add(item);
		}
		return result;
	}

	public List<Map<String, Object>> getUtilisationByScheme() {
		List<SubsidyApplicationDto> apps = getSubsidyApplications();
		List<SchemeCatalogDto> schemes = getSchemeCatalogs();

		Map<Integer, Double> utilisedGroup = apps.stream()
				.filter(a -> a.getSchemeId() != null && a.getDisbursedAmount() != null)
				.collect(Collectors.groupingBy(
						SubsidyApplicationDto::getSchemeId,
						Collectors.summingDouble(SubsidyApplicationDto::getDisbursedAmount)
				));

		List<Map<String, Object>> result = new ArrayList<>();
		for (SchemeCatalogDto scheme : schemes) {
			Map<String, Object> item = new HashMap<>();
			Integer id = scheme.getSchemeId();
			item.put("schemeName", scheme.getSchemeName());
			item.put("totalDisbursed", utilisedGroup.getOrDefault(id, 0.0));
			item.put("benefitAmount", scheme.getBenefitAmount());
			result.add(item);
		}
		return result;
	}

	public List<Map<String, Object>> getDisbursementTrend() {
		List<SubsidyApplicationDto> apps = getSubsidyApplications();

		Map<String, Double> grouped = apps.stream()
				.filter(a -> a.getDisbursedDate() != null && a.getDisbursedAmount() != null)
				.collect(Collectors.groupingBy(
						a -> a.getDisbursedDate().format(DateTimeFormatter.ofPattern("yyyy-MM")),
						Collectors.summingDouble(SubsidyApplicationDto::getDisbursedAmount)
				));

		return grouped.entrySet().stream()
				.sorted(Map.Entry.comparingByKey())
				.map(e -> {
					Map<String, Object> item = new HashMap<>();
					item.put("month", e.getKey());
					item.put("disbursedAmount", e.getValue());
					return item;
				})
				.collect(Collectors.toList());
	}

	public List<Map<String, Object>> getSalesTrend() {
		List<ProduceSaleDto> sales = getProduceSales();

		Map<String, Double> grouped = sales.stream()
				.filter(s -> s.getSaleDate() != null && s.getTotalAmount() != null)
				.collect(Collectors.groupingBy(
						s -> s.getSaleDate().format(DateTimeFormatter.ofPattern("yyyy-MM")),
						Collectors.summingDouble(ProduceSaleDto::getTotalAmount)
				));

		return grouped.entrySet().stream()
				.sorted(Map.Entry.comparingByKey())
				.map(e -> {
					Map<String, Object> item = new HashMap<>();
					item.put("month", e.getKey());
					item.put("salesAmount", e.getValue());
					return item;
				})
				.collect(Collectors.toList());
	}

	public List<Map<String, Object>> getEligibilityDistribution() {
		List<SubsidyApplicationDto> apps = getSubsidyApplications();

		long under50 = 0;
		long score50to70 = 0;
		long score70to90 = 0;
		long over90 = 0;

		for (SubsidyApplicationDto app : apps) {
			Double score = app.getEligibilityScore();
			if (score == null) continue;
			if (score < 50.0) {
				under50++;
			} else if (score < 70.0) {
				score50to70++;
			} else if (score < 90.0) {
				score70to90++;
			} else {
				over90++;
			}
		}

		List<Map<String, Object>> result = new ArrayList<>();
		result.add(createBracketMap("< 50", under50));
		result.add(createBracketMap("50-70", score50to70));
		result.add(createBracketMap("70-90", score70to90));
		result.add(createBracketMap("> 90", over90));
		return result;
	}

	private Map<String, Object> createBracketMap(String bracket, long count) {
		Map<String, Object> map = new HashMap<>();
		map.put("bracket", bracket);
		map.put("count", count);
		return map;
	}

	public List<Map<String, Object>> getSalesByRegion() {
		List<ProduceSaleDto> sales = getProduceSales();
		List<ProduceListingDto> listings = getProduceListings();
		List<FarmerProfileDto> profiles = getFarmerProfiles();

		Map<Integer, ProduceListingDto> listingMap = listings.stream()
				.collect(Collectors.toMap(ProduceListingDto::getListingId, l -> l, (v1, v2) -> v1));

		Map<Integer, String> farmerRegionMap = profiles.stream()
				.collect(Collectors.toMap(
						FarmerProfileDto::getFarmerId,
						p -> p.getDistrict() + ", " + p.getState(),
						(v1, v2) -> v1
				));

		Map<String, Double> grouped = sales.stream()
				.filter(s -> s.getListingId() != null && s.getTotalAmount() != null)
				.collect(Collectors.groupingBy(
						s -> {
							ProduceListingDto listing = listingMap.get(s.getListingId());
							if (listing != null && listing.getFarmerId() != null) {
								return farmerRegionMap.getOrDefault(listing.getFarmerId(), "Unknown Region");
							}
							return "Unknown Region";
						},
						Collectors.summingDouble(ProduceSaleDto::getTotalAmount)
				));

		List<Map<String, Object>> result = new ArrayList<>();
		grouped.forEach((key, val) -> {
			Map<String, Object> item = new HashMap<>();
			item.put("region", key);
			item.put("salesValue", val);
			result.add(item);
		});
		return result;
	}

	public List<Map<String, Object>> getPriceDiscovery() {
		List<ProduceSaleDto> sales = getProduceSales();
		List<ProduceListingDto> listings = getProduceListings();
		List<CropCatalogDto> crops = getCropCatalogs();

		Map<Integer, Integer> listingCropMap = listings.stream()
				.collect(Collectors.toMap(ProduceListingDto::getListingId, ProduceListingDto::getCropId, (v1, v2) -> v1));

		Map<Integer, String> cropNameMap = crops.stream()
				.collect(Collectors.toMap(CropCatalogDto::getCropId, CropCatalogDto::getCropName, (v1, v2) -> v1));

		Map<Integer, Double> grouped = sales.stream()
				.filter(s -> s.getListingId() != null && s.getAgreedPricePerKg() != null)
				.collect(Collectors.groupingBy(
						s -> listingCropMap.getOrDefault(s.getListingId(), -1),
						Collectors.averagingDouble(ProduceSaleDto::getAgreedPricePerKg)
				));

		List<Map<String, Object>> result = new ArrayList<>();
		grouped.forEach((key, val) -> {
			if (key != -1) {
				Map<String, Object> item = new HashMap<>();
				item.put("cropName", cropNameMap.getOrDefault(key, "Crop #" + key));
				item.put("averagePricePerKg", val);
				result.add(item);
			}
		});
		return result;
	}

	public List<Map<String, Object>> getQualityGradeDistribution() {
		List<ProduceListingDto> listings = getProduceListings();

		Map<String, Long> grouped = listings.stream()
				.filter(l -> l.getQualityGrade() != null)
				.collect(Collectors.groupingBy(
						ProduceListingDto::getQualityGrade,
						Collectors.counting()
				));

		List<Map<String, Object>> result = new ArrayList<>();
		grouped.forEach((key, val) -> {
			Map<String, Object> item = new HashMap<>();
			item.put("qualityGrade", key);
			item.put("count", val);
			result.add(item);
		});
		return result;
	}
}

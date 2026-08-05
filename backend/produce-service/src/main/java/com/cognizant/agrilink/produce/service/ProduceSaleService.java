package com.cognizant.agrilink.produce.service;

import com.cognizant.agrilink.produce.dto.ProduceSaleDto;
import com.cognizant.agrilink.produce.entity.ProduceListing;
import com.cognizant.agrilink.produce.entity.ProduceSale;
import com.cognizant.agrilink.produce.enums.ListingStatus;
import com.cognizant.agrilink.produce.enums.PaymentStatus;
import com.cognizant.agrilink.produce.exception.ResourceNotFoundException;
import com.cognizant.agrilink.produce.repository.ProduceListingRepository;
import com.cognizant.agrilink.produce.repository.ProduceSaleRepository;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.stream.Collectors;
import org.springframework.stereotype.Service;

@Service
public class ProduceSaleService {

	/**
	 * Floor, as a percentage of the farmer's asking price, that a buyer's agreed
	 * price may not go below. Buyers negotiate a percentage of the asking price
	 * rather than an arbitrary figure, so a listing can never be undercut.
	 */
	public static final double MIN_OFFER_PERCENT_OF_ASKING = 90.0;

	/** Tolerance for floating-point comparisons on kg / rupee amounts. */
	private static final double EPSILON = 0.000001;

	private final ProduceSaleRepository produceSaleRepository;
	private final ProduceListingRepository produceListingRepository;

	public ProduceSaleService(ProduceSaleRepository produceSaleRepository,
			ProduceListingRepository produceListingRepository) {
		this.produceSaleRepository = produceSaleRepository;
		this.produceListingRepository = produceListingRepository;
	}

	public List<ProduceSale> getAll() {
		return produceSaleRepository.findAll();
	}

	/** Sales whose listing belongs to one of the given farmer profile id(s). */
	public List<ProduceSale> getByOwnerFarmerIds(List<Integer> farmerIds) {
		if (farmerIds == null || farmerIds.isEmpty()) {
			return List.of();
		}
		List<Integer> listingIds = produceListingRepository.findByFarmerIdIn(farmerIds).stream()
				.map(ProduceListing::getListingId)
				.toList();
		if (listingIds.isEmpty()) {
			return List.of();
		}
		return produceSaleRepository.findByListingIdIn(listingIds);
	}

	/** True if the sale's listing belongs to one of the given farmer profile id(s). */
	public boolean isSaleOwnedBy(ProduceSale sale, List<Integer> farmerIds) {
		if (sale == null || farmerIds == null || farmerIds.isEmpty()) {
			return false;
		}
		return produceListingRepository.findById(sale.getListingId())
				.map(listing -> farmerIds.contains(listing.getFarmerId()))
				.orElse(false);
	}

	public ProduceSale getById(Integer id) {
		return produceSaleRepository.findById(id)
				.orElseThrow(() -> new ResourceNotFoundException("ProduceSale not found with id " + id));
	}

	/** farmerId that owns the given listing, or {@code null} if the listing is missing.
	 *  Used to route a sale/booking notification to the selling farmer. */
	public Integer getListingOwnerFarmerId(Integer listingId) {
		if (listingId == null) {
			return null;
		}
		return produceListingRepository.findById(listingId)
				.map(ProduceListing::getFarmerId)
				.orElse(null);
	}

	public ProduceSale create(ProduceSaleDto dto) {
		validateAgainstListing(dto, null);
		ProduceSale produceSale = ProduceSale.builder()
				.listingId(dto.getListingId())
				.buyerId(dto.getBuyerId())
				.quantitySoldKg(dto.getQuantitySoldKg())
				.agreedPricePerKg(dto.getAgreedPricePerKg())
				.totalAmount(dto.getTotalAmount())
				.saleDate(dto.getSaleDate())
				.paymentStatus(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : PaymentStatus.PE)
				.farmerPaymentConfirmed(false)
				.build();
		ProduceSale saved = produceSaleRepository.save(produceSale);
		refreshListingStatus(saved.getListingId());
		return saved;
	}

	public ProduceSale update(Integer id, ProduceSaleDto dto) {
		ProduceSale produceSale = getById(id);
		validateAgainstListing(dto, produceSale);
		Integer previousListingId = produceSale.getListingId();
		produceSale.setListingId(dto.getListingId());
		produceSale.setBuyerId(dto.getBuyerId());
		produceSale.setQuantitySoldKg(dto.getQuantitySoldKg());
		produceSale.setAgreedPricePerKg(dto.getAgreedPricePerKg());
		produceSale.setTotalAmount(dto.getTotalAmount());
		produceSale.setSaleDate(dto.getSaleDate());
		produceSale.setPaymentStatus(dto.getPaymentStatus());
		applyFarmerConfirmation(produceSale, dto);
		ProduceSale saved = produceSaleRepository.save(produceSale);
		refreshListingStatus(saved.getListingId());
		// If the sale was moved to a different listing, recompute the old one too.
		if (previousListingId != null && !previousListingId.equals(saved.getListingId())) {
			refreshListingStatus(previousListingId);
		}
		return saved;
	}

	public void delete(Integer id) {
		ProduceSale produceSale = getById(id);
		Integer listingId = produceSale.getListingId();
		produceSaleRepository.delete(produceSale);
		refreshListingStatus(listingId);
	}

	/**
	 * Records the selling farmer's acknowledgement that the money actually arrived.
	 * Only meaningful once the buyer has marked the sale Paid, and idempotent so a
	 * repeated confirmation is harmless.
	 */
	public ProduceSale confirmFarmerPayment(Integer id) {
		ProduceSale sale = getById(id);
		if (sale.getPaymentStatus() != PaymentStatus.PD) {
			throw new IllegalStateException(
					"Receipt can only be confirmed after the buyer has marked this payment as Paid");
		}
		if (!Boolean.TRUE.equals(sale.getFarmerPaymentConfirmed())) {
			sale.setFarmerPaymentConfirmed(true);
			sale.setFarmerConfirmedDate(LocalDate.now());
			return produceSaleRepository.save(sale);
		}
		return sale;
	}

	/** Kg still open for purchase on a listing, i.e. listed quantity minus everything already sold. */
	public double availableQuantityKg(ProduceListing listing) {
		if (listing == null) {
			return 0.0;
		}
		double listed = listing.getQuantityKg() != null ? listing.getQuantityKg() : 0.0;
		return Math.max(0.0, listed - soldQuantityKg(listing.getListingId(), null));
	}

	/** Populates the derived {@code availableQuantityKg} on a single listing being returned. */
	public void applyAvailableQuantity(ProduceListing listing) {
		if (listing != null) {
			listing.setAvailableQuantityKg(availableQuantityKg(listing));
		}
	}

	/**
	 * Populates the derived {@code availableQuantityKg} on every listing in the
	 * batch, resolving all sales in a single query rather than one per listing.
	 */
	public void applyAvailableQuantity(List<ProduceListing> listings) {
		if (listings == null || listings.isEmpty()) {
			return;
		}
		List<Integer> listingIds = listings.stream()
				.map(ProduceListing::getListingId)
				.filter(Objects::nonNull)
				.toList();
		Map<Integer, Double> soldByListing = listingIds.isEmpty() ? Map.of()
				: produceSaleRepository.findByListingIdIn(listingIds).stream()
						.filter(sale -> sale.getListingId() != null && sale.getQuantitySoldKg() != null)
						.collect(Collectors.groupingBy(ProduceSale::getListingId,
								Collectors.summingDouble(ProduceSale::getQuantitySoldKg)));

		for (ProduceListing listing : listings) {
			double listed = listing.getQuantityKg() != null ? listing.getQuantityKg() : 0.0;
			double sold = soldByListing.getOrDefault(listing.getListingId(), 0.0);
			listing.setAvailableQuantityKg(Math.max(0.0, listed - sold));
		}
	}

	/** Total kg committed against a listing, optionally ignoring one sale (the one being updated). */
	private double soldQuantityKg(Integer listingId, Integer excludeSaleId) {
		if (listingId == null) {
			return 0.0;
		}
		return produceSaleRepository.findByListingId(listingId).stream()
				.filter(sale -> excludeSaleId == null || !excludeSaleId.equals(sale.getSaleId()))
				.map(ProduceSale::getQuantitySoldKg)
				.filter(Objects::nonNull)
				.mapToDouble(Double::doubleValue)
				.sum();
	}

	/**
	 * Enforces the two marketplace rules a buyer cannot bypass: never buy more than
	 * the quantity still available, and never agree a price below
	 * {@value #MIN_OFFER_PERCENT_OF_ASKING}% of the farmer's asking price. Skipped
	 * when the listing cannot be resolved, so a sale is never blocked by missing
	 * reference data.
	 *
	 * @param existing the sale being amended, or {@code null} for a new purchase. Its
	 *        own quantity is excluded from the availability sum, and checks that would
	 *        only reject terms it already carries (a withdrawn listing, an unchanged
	 *        price) are skipped so settling an older sale never fails.
	 */
	private void validateAgainstListing(ProduceSaleDto dto, ProduceSale existing) {
		if (dto == null || dto.getListingId() == null) {
			return;
		}
		produceListingRepository.findById(dto.getListingId()).ifPresent(listing -> {
			if (existing == null && listing.getStatus() == ListingStatus.WD) {
				throw new IllegalArgumentException(
						"Listing #" + listing.getListingId() + " has been withdrawn and is no longer for sale");
			}

			Integer excludeSaleId = existing != null ? existing.getSaleId() : null;
			double listed = listing.getQuantityKg() != null ? listing.getQuantityKg() : 0.0;
			double available = Math.max(0.0, listed - soldQuantityKg(listing.getListingId(), excludeSaleId));
			Double requested = dto.getQuantitySoldKg();
			if (requested != null && requested > available + EPSILON) {
				throw new IllegalArgumentException("Quantity " + format(requested)
						+ " Kg exceeds the " + format(available) + " Kg still available on listing #"
						+ listing.getListingId());
			}

			Double asking = listing.getAskingPricePerKg();
			Double agreed = dto.getAgreedPricePerKg();
			boolean priceUnchanged = existing != null && Objects.equals(existing.getAgreedPricePerKg(), agreed);
			if (asking != null && asking > 0 && agreed != null && !priceUnchanged) {
				double minimumPrice = asking * MIN_OFFER_PERCENT_OF_ASKING / 100.0;
				if (agreed < minimumPrice - EPSILON) {
					throw new IllegalArgumentException("Agreed price of " + format(agreed)
							+ " per Kg is below the minimum " + format(MIN_OFFER_PERCENT_OF_ASKING)
							+ "% of the asking price (" + format(minimumPrice) + " per Kg)");
				}
			}
		});
	}

	/**
	 * Carries the farmer's receipt confirmation across an update. An explicit flag on
	 * the payload wins; otherwise the existing confirmation is preserved, and any move
	 * away from Paid clears it so the farmer is asked again on the next settlement.
	 */
	private void applyFarmerConfirmation(ProduceSale produceSale, ProduceSaleDto dto) {
		if (dto.getFarmerPaymentConfirmed() != null) {
			produceSale.setFarmerPaymentConfirmed(dto.getFarmerPaymentConfirmed());
			produceSale.setFarmerConfirmedDate(dto.getFarmerConfirmedDate());
		}
		if (produceSale.getPaymentStatus() != PaymentStatus.PD) {
			produceSale.setFarmerPaymentConfirmed(false);
			produceSale.setFarmerConfirmedDate(null);
		}
	}

	private static String format(double value) {
		return String.format("%.2f", value);
	}

	/**
	 * Recomputes a listing's status from the cumulative quantity sold across all its sales:
	 * fully covered -> Sold, partially covered -> PartiallyBooked, none -> Available.
	 * A Withdrawn listing is left untouched.
	 */
	private void refreshListingStatus(Integer listingId) {
		if (listingId == null) {
			return;
		}
		produceListingRepository.findById(listingId).ifPresent(listing -> {
			if (listing.getStatus() == ListingStatus.WD) {
				return;
			}
			double listedQty = listing.getQuantityKg() != null ? listing.getQuantityKg() : 0.0;
			double soldQty = produceSaleRepository.findByListingId(listingId).stream()
					.map(ProduceSale::getQuantitySoldKg)
					.filter(q -> q != null)
					.mapToDouble(Double::doubleValue)
					.sum();

			ListingStatus newStatus;
			if (soldQty <= 0.0) {
				newStatus = ListingStatus.AV;
			} else if (soldQty >= listedQty) {
				newStatus = ListingStatus.SO;
			} else {
				newStatus = ListingStatus.PB;
			}

			if (listing.getStatus() != newStatus) {
				listing.setStatus(newStatus);
				produceListingRepository.save(listing);
			}
		});
	}
}

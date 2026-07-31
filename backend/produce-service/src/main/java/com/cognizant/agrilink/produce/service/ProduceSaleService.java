package com.cognizant.agrilink.produce.service;

import com.cognizant.agrilink.produce.dto.ProduceSaleDto;
import com.cognizant.agrilink.produce.entity.ProduceListing;
import com.cognizant.agrilink.produce.entity.ProduceSale;
import com.cognizant.agrilink.produce.enums.ListingStatus;
import com.cognizant.agrilink.produce.enums.PaymentStatus;
import com.cognizant.agrilink.produce.exception.ResourceNotFoundException;
import com.cognizant.agrilink.produce.repository.ProduceListingRepository;
import com.cognizant.agrilink.produce.repository.ProduceSaleRepository;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ProduceSaleService {

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

	public ProduceSale create(ProduceSaleDto dto) {
		ProduceSale produceSale = ProduceSale.builder()
				.listingId(dto.getListingId())
				.buyerId(dto.getBuyerId())
				.quantitySoldKg(dto.getQuantitySoldKg())
				.agreedPricePerKg(dto.getAgreedPricePerKg())
				.totalAmount(dto.getTotalAmount())
				.saleDate(dto.getSaleDate())
				.paymentStatus(dto.getPaymentStatus() != null ? dto.getPaymentStatus() : PaymentStatus.PE)
				.build();
		ProduceSale saved = produceSaleRepository.save(produceSale);
		refreshListingStatus(saved.getListingId());
		return saved;
	}

	public ProduceSale update(Integer id, ProduceSaleDto dto) {
		ProduceSale produceSale = getById(id);
		Integer previousListingId = produceSale.getListingId();
		produceSale.setListingId(dto.getListingId());
		produceSale.setBuyerId(dto.getBuyerId());
		produceSale.setQuantitySoldKg(dto.getQuantitySoldKg());
		produceSale.setAgreedPricePerKg(dto.getAgreedPricePerKg());
		produceSale.setTotalAmount(dto.getTotalAmount());
		produceSale.setSaleDate(dto.getSaleDate());
		produceSale.setPaymentStatus(dto.getPaymentStatus());
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

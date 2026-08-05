package com.cognizant.agrilink.produce.config;

import com.cognizant.agrilink.produce.entity.ProduceListing;
import com.cognizant.agrilink.produce.entity.ProduceSale;
import com.cognizant.agrilink.produce.enums.ListingStatus;
import com.cognizant.agrilink.produce.enums.PaymentStatus;
import com.cognizant.agrilink.produce.repository.ProduceListingRepository;
import com.cognizant.agrilink.produce.repository.ProduceSaleRepository;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

/**
 * Seeds sample produce listings and sales on startup so the marketplace and
 * sales log are populated out of the box. Idempotent: does nothing if the
 * tables already contain data.
 *
 * <p>Referenced farmerId(s) (1, 2) and cropId(s) (1-3) align with the demo data
 * seeded in farmer-service and crop-service.</p>
 */
@Component
@RequiredArgsConstructor
public class ProduceDataSeeder implements CommandLineRunner {

	private static final Logger log = LoggerFactory.getLogger(ProduceDataSeeder.class);

	private final ProduceListingRepository listingRepository;
	private final ProduceSaleRepository saleRepository;

	@Override
	public void run(String... args) {
		if (listingRepository.count() > 0 || saleRepository.count() > 0) {
			log.info("Produce data already present - skipping sample data seeding.");
			return;
		}

		List<ProduceListing> listings = seedListings();
		seedSales(listings);
		log.info("Seeded {} sample produce listings and sales.", listings.size());
	}

	private List<ProduceListing> seedListings() {
		// {farmerId, cropId, quantityKg, grade, pricePerKg, status}
		Object[][] rows = {
				{1, 1, 2500.0, "A", 25.0, ListingStatus.SO},
				{2, 2, 1800.0, "A", 22.0, ListingStatus.SO},
				{1, 3, 1200.0, "A", 55.0, ListingStatus.PB},
				{2, 1, 3000.0, "B", 20.0, ListingStatus.PB},
				{1, 2, 900.0, "A", 30.0, ListingStatus.AV},
				{2, 3, 1500.0, "B", 48.0, ListingStatus.PB},
				{1, 1, 2100.0, "C", 18.0, ListingStatus.PB},
				{2, 2, 750.0, "A", 26.0, ListingStatus.WD},
				{1, 3, 1350.0, "B", 52.0, ListingStatus.AV},
				{2, 1, 2800.0, "A", 24.0, ListingStatus.PB},
				{1, 2, 640.0, "B", 28.0, ListingStatus.AV},
				{2, 3, 1900.0, "A", 60.0, ListingStatus.AV},
				// bala (farmerId 6) — a real login-linked farmer, so their portal isn't empty
				{6, 1, 2200.0, "A", 26.0, ListingStatus.SO},   // index 12
				{6, 2, 1400.0, "B", 21.0, ListingStatus.PB},   // index 13
				{6, 3, 1000.0, "A", 58.0, ListingStatus.AV},   // index 14
				{6, 1, 1750.0, "C", 17.5, ListingStatus.WD},   // index 15
				// yogapriya (farmerId 16) — a real login-linked farmer
				{16, 2, 2600.0, "A", 27.0, ListingStatus.SO},  // index 16
				{16, 3, 1150.0, "B", 50.0, ListingStatus.PB},  // index 17
				{16, 1, 3200.0, "A", 23.0, ListingStatus.AV},  // index 18
				{16, 2, 820.0, "A", 29.0, ListingStatus.AV},   // index 19
				// Demo Farmer (farmerId 17) — the default farmer login (farmer@agrilink.com)
				{17, 1, 1200.0, "A", 28.0, ListingStatus.SO},  // index 20
				{17, 2, 800.0, "A", 45.0, ListingStatus.PB},   // index 21
				{17, 3, 2000.0, "B", 22.0, ListingStatus.AV},  // index 22
				{17, 1, 600.0, "C", 18.0, ListingStatus.AV},   // index 23
				{17, 2, 1500.0, "A", 55.0, ListingStatus.WD}   // index 24
		};

		List<ProduceListing> listings = new ArrayList<>();
		int dayOffset = 5;
		for (Object[] r : rows) {
			ProduceListing listing = ProduceListing.builder()
					.farmerId((Integer) r[0])
					.cropId((Integer) r[1])
					.harvestDate(LocalDate.of(2026, 1, 1).plusDays(dayOffset))
					.quantityKg((Double) r[2])
					.qualityGrade((String) r[3])
					.askingPricePerKg((Double) r[4])
					.status((ListingStatus) r[5])
					.build();
			listings.add(listingRepository.save(listing));
			dayOffset += 12;
		}
		return listings;
	}

	/**
	 * Every agreed price sits at or above the {@code MIN_OFFER_PERCENT_OF_ASKING}
	 * floor enforced on real purchases, and the cumulative quantity sold per listing
	 * matches the listing status seeded above so the marketplace's available-quantity
	 * column reads consistently. Paid settlements are split between farmer-confirmed
	 * and awaiting-confirmation to exercise both sides of the receipt check.
	 */
	private void seedSales(List<ProduceListing> listings) {
		// Two settled sales fully cover listing #1 (marked SO); a partial sale
		// covers listing #3 (marked PB); the rest are standalone settlements.
		recordSale(listings.get(0), 3, 1500.0, 24.5, LocalDate.of(2026, 1, 12), PaymentStatus.PD, true);
		recordSale(listings.get(0), 3, 1000.0, 24.0, LocalDate.of(2026, 1, 18), PaymentStatus.PD, true);
		recordSale(listings.get(1), 3, 1800.0, 21.8, LocalDate.of(2026, 3, 20), PaymentStatus.PD, true);
		recordSale(listings.get(2), 3, 500.0, 54.0, LocalDate.of(2026, 6, 25), PaymentStatus.PE, false);
		recordSale(listings.get(3), 4, 1200.0, 19.5, LocalDate.of(2026, 7, 2), PaymentStatus.PE, false);
		recordSale(listings.get(5), 4, 800.0, 47.0, LocalDate.of(2026, 7, 8), PaymentStatus.PE, false);
		recordSale(listings.get(6), 3, 2000.0, 17.5, LocalDate.of(2026, 7, 15), PaymentStatus.PD, false);
		recordSale(listings.get(9), 4, 1000.0, 23.5, LocalDate.of(2026, 7, 20), PaymentStatus.PE, false);

		// bala (farmerId 6): two settled sales fully cover listing index 12 (SO),
		// a partial sale covers index 13 (PB).
		recordSale(listings.get(12), 4, 1200.0, 26.0, LocalDate.of(2026, 2, 10), PaymentStatus.PD, true);
		recordSale(listings.get(12), 4, 1000.0, 25.5, LocalDate.of(2026, 2, 14), PaymentStatus.PD, false);
		recordSale(listings.get(13), 4, 600.0, 21.0, LocalDate.of(2026, 2, 25), PaymentStatus.PE, false);
		// yogapriya (farmerId 16): listing index 16 sold, index 17 partially booked.
		recordSale(listings.get(16), 4, 2600.0, 27.0, LocalDate.of(2026, 2, 15), PaymentStatus.PD, true);
		recordSale(listings.get(17), 4, 500.0, 50.0, LocalDate.of(2026, 2, 27), PaymentStatus.PE, false);
		// Demo Farmer (farmerId 17): listing index 20 fully sold, index 21 partially booked.
		recordSale(listings.get(20), 4, 700.0, 27.5, LocalDate.of(2026, 2, 15), PaymentStatus.PD, true);
		recordSale(listings.get(20), 3, 500.0, 28.0, LocalDate.of(2026, 2, 20), PaymentStatus.PD, false);
		recordSale(listings.get(21), 4, 400.0, 44.0, LocalDate.of(2026, 3, 10), PaymentStatus.PE, false);
	}

	private void recordSale(ProduceListing listing, int buyerId, double quantitySoldKg,
			double agreedPricePerKg, LocalDate saleDate, PaymentStatus paymentStatus,
			boolean farmerPaymentConfirmed) {
		ProduceSale sale = ProduceSale.builder()
				.listingId(listing.getListingId())
				.buyerId(buyerId)
				.quantitySoldKg(quantitySoldKg)
				.agreedPricePerKg(agreedPricePerKg)
				.totalAmount(quantitySoldKg * agreedPricePerKg)
				.saleDate(saleDate)
				.paymentStatus(paymentStatus)
				.farmerPaymentConfirmed(farmerPaymentConfirmed)
				.farmerConfirmedDate(farmerPaymentConfirmed ? saleDate.plusDays(2) : null)
				.build();
		saleRepository.save(sale);
	}
}

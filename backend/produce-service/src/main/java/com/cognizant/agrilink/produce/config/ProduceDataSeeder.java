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
				{2, 1, 3000.0, "B", 20.0, ListingStatus.AV},
				{1, 2, 900.0, "A", 30.0, ListingStatus.AV},
				{2, 3, 1500.0, "B", 48.0, ListingStatus.AV},
				{1, 1, 2100.0, "C", 18.0, ListingStatus.AV},
				{2, 2, 750.0, "A", 26.0, ListingStatus.WD},
				{1, 3, 1350.0, "B", 52.0, ListingStatus.AV},
				{2, 1, 2800.0, "A", 24.0, ListingStatus.AV},
				{1, 2, 640.0, "B", 28.0, ListingStatus.AV},
				{2, 3, 1900.0, "A", 60.0, ListingStatus.AV}
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

	private void seedSales(List<ProduceListing> listings) {
		// Two settled sales fully cover listing #1 (marked SO); a partial sale
		// covers listing #3 (marked PB); the rest are standalone settlements.
		recordSale(listings.get(0), 3, 1500.0, 24.5, LocalDate.of(2026, 1, 12), PaymentStatus.PD);
		recordSale(listings.get(0), 3, 1000.0, 24.0, LocalDate.of(2026, 1, 18), PaymentStatus.PD);
		recordSale(listings.get(1), 3, 1800.0, 21.8, LocalDate.of(2026, 3, 20), PaymentStatus.PD);
		recordSale(listings.get(2), 3, 500.0, 54.0, LocalDate.of(2026, 6, 25), PaymentStatus.PE);
		recordSale(listings.get(3), 4, 1200.0, 19.5, LocalDate.of(2026, 7, 2), PaymentStatus.PE);
		recordSale(listings.get(5), 4, 800.0, 47.0, LocalDate.of(2026, 7, 8), PaymentStatus.OV);
		recordSale(listings.get(6), 3, 2000.0, 17.5, LocalDate.of(2026, 7, 15), PaymentStatus.PD);
		recordSale(listings.get(9), 4, 1000.0, 23.5, LocalDate.of(2026, 7, 20), PaymentStatus.OV);
	}

	private void recordSale(ProduceListing listing, int buyerId, double quantitySoldKg,
			double agreedPricePerKg, LocalDate saleDate, PaymentStatus paymentStatus) {
		ProduceSale sale = ProduceSale.builder()
				.listingId(listing.getListingId())
				.buyerId(buyerId)
				.quantitySoldKg(quantitySoldKg)
				.agreedPricePerKg(agreedPricePerKg)
				.totalAmount(quantitySoldKg * agreedPricePerKg)
				.saleDate(saleDate)
				.paymentStatus(paymentStatus)
				.build();
		saleRepository.save(sale);
	}
}

package com.cognizant.agrilink.input.config;

import com.cognizant.agrilink.input.entity.Catalog;
import com.cognizant.agrilink.input.enums.Status;
import com.cognizant.agrilink.input.repository.CatalogRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class InputDataSeeder implements CommandLineRunner {

	private static final Logger log = LoggerFactory.getLogger(InputDataSeeder.class);

	private final CatalogRepository catalogRepository;

	@Override
	public void run(String... args) {
		if (catalogRepository.count() > 0) {
			log.info("Catalog data already present - skipping sample data seeding.");
			return;
		}

		List<Catalog> items = List.of(
			// Fertilizers
			Catalog.builder().name("Urea").category("Fertilizer").unit("kg")
				.pricePerUnit(6.5).subsidisedPrice(4.0).availableStock(5000).status(Status.AC).build(),
			Catalog.builder().name("DAP").category("Fertilizer").unit("kg")
				.pricePerUnit(27.0).subsidisedPrice(18.0).availableStock(4000).status(Status.AC).build(),
			Catalog.builder().name("MOP").category("Fertilizer").unit("kg")
				.pricePerUnit(17.0).subsidisedPrice(12.0).availableStock(3000).status(Status.AC).build(),
			Catalog.builder().name("NPK 10-26-26").category("Fertilizer").unit("kg")
				.pricePerUnit(22.0).subsidisedPrice(15.0).availableStock(3500).status(Status.AC).build(),
			Catalog.builder().name("Vermicompost").category("Fertilizer").unit("kg")
				.pricePerUnit(8.0).subsidisedPrice(5.5).availableStock(6000).status(Status.AC).build(),

			// Pesticides
			Catalog.builder().name("Chlorpyrifos 20EC").category("Pesticide").unit("litre")
				.pricePerUnit(350.0).subsidisedPrice(280.0).availableStock(800).status(Status.AC).build(),
			Catalog.builder().name("Mancozeb 75WP").category("Pesticide").unit("kg")
				.pricePerUnit(280.0).subsidisedPrice(220.0).availableStock(600).status(Status.AC).build(),
			Catalog.builder().name("Imidacloprid 17.8SL").category("Pesticide").unit("litre")
				.pricePerUnit(520.0).subsidisedPrice(420.0).availableStock(500).status(Status.AC).build(),
			Catalog.builder().name("Glyphosate 41SL").category("Pesticide").unit("litre")
				.pricePerUnit(310.0).subsidisedPrice(250.0).availableStock(700).status(Status.AC).build(),
			Catalog.builder().name("Carbendazim 50WP").category("Pesticide").unit("kg")
				.pricePerUnit(390.0).subsidisedPrice(310.0).availableStock(400).status(Status.IN).build(),

			// Seeds
			Catalog.builder().name("Paddy HYV IR-64").category("Seed").unit("kg")
				.pricePerUnit(45.0).subsidisedPrice(32.0).availableStock(2000).status(Status.AC).build(),
			Catalog.builder().name("Wheat HD-2967").category("Seed").unit("kg")
				.pricePerUnit(38.0).subsidisedPrice(28.0).availableStock(2500).status(Status.AC).build(),
			Catalog.builder().name("Maize Hybrid DHM-117").category("Seed").unit("kg")
				.pricePerUnit(120.0).subsidisedPrice(90.0).availableStock(1500).status(Status.AC).build(),
			Catalog.builder().name("Tomato F1 Hybrid").category("Seed").unit("g")
				.pricePerUnit(2.5).subsidisedPrice(1.8).availableStock(10000).status(Status.AC).build(),
			Catalog.builder().name("Cotton Bt Hybrid").category("Seed").unit("packet")
				.pricePerUnit(850.0).subsidisedPrice(650.0).availableStock(1200).status(Status.AC).build(),

			// Equipment
			Catalog.builder().name("Hand Sprayer 16L").category("Equipment").unit("unit")
				.pricePerUnit(1200.0).subsidisedPrice(900.0).availableStock(300).status(Status.AC).build(),
			Catalog.builder().name("Power Tiller").category("Equipment").unit("unit")
				.pricePerUnit(85000.0).subsidisedPrice(65000.0).availableStock(50).status(Status.AC).build(),
			Catalog.builder().name("Drip Irrigation Kit (1 acre)").category("Equipment").unit("kit")
				.pricePerUnit(15000.0).subsidisedPrice(10000.0).availableStock(150).status(Status.AC).build(),
			Catalog.builder().name("Soil pH Meter").category("Equipment").unit("unit")
				.pricePerUnit(2500.0).subsidisedPrice(2000.0).availableStock(200).status(Status.AC).build(),
			Catalog.builder().name("Chaff Cutter").category("Equipment").unit("unit")
				.pricePerUnit(9500.0).subsidisedPrice(7000.0).availableStock(80).status(Status.IN).build()
		);

		catalogRepository.saveAll(items);
		log.info("Seeded {} catalog items.", items.size());
	}
}

package com.cognizant.agrilink.produce.service;

import com.cognizant.agrilink.produce.dto.ProduceSaleDto;
import com.cognizant.agrilink.produce.entity.ProduceSale;
import com.cognizant.agrilink.produce.repository.ProduceSaleRepository;
import com.cognizant.agrilink.produce.enums.PaymentStatus;
import com.cognizant.agrilink.produce.exception.ResourceNotFoundException;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class ProduceSaleService {

	private final ProduceSaleRepository produceSaleRepository;

	public ProduceSaleService(ProduceSaleRepository produceSaleRepository) {
		this.produceSaleRepository = produceSaleRepository;
	}

	public List<ProduceSale> getAll() {
		return produceSaleRepository.findAll();
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
		return produceSaleRepository.save(produceSale);
	}

	public ProduceSale update(Integer id, ProduceSaleDto dto) {
		ProduceSale produceSale = getById(id);
		produceSale.setListingId(dto.getListingId());
		produceSale.setBuyerId(dto.getBuyerId());
		produceSale.setQuantitySoldKg(dto.getQuantitySoldKg());
		produceSale.setAgreedPricePerKg(dto.getAgreedPricePerKg());
		produceSale.setTotalAmount(dto.getTotalAmount());
		produceSale.setSaleDate(dto.getSaleDate());
		produceSale.setPaymentStatus(dto.getPaymentStatus());
		return produceSaleRepository.save(produceSale);
	}

	public void delete(Integer id) {
		ProduceSale produceSale = getById(id);
		produceSaleRepository.delete(produceSale);
	}
}

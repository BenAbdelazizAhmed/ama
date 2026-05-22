package com.example.amanafarm_backend.service;
import com.example.amanafarm_backend.dto.WholesaleItemRequest;
import com.example.amanafarm_backend.dto.WholesaleItemResponse;
import com.example.amanafarm_backend.model.WholesaleItem;
import com.example.amanafarm_backend.repository.WholesaleItemRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class WholesaleItemService {
    private final WholesaleItemRepository wholesaleItemRepository;

    public WholesaleItemResponse createItem(WholesaleItemRequest req) {
        WholesaleItem w = new WholesaleItem();
        w.setTitle(req.getTitle());
        w.setCategory(req.getCategory());
        w.setDescription(req.getDescription());
        w.setPrice(req.getPrice());
        w.setPriceUnit(req.getPriceUnit());
        w.setMinQuantity(req.getMinQuantity());
        w.setLocation(req.getLocation());
        w.setSupplierName(req.getSupplierName());
        w.setImageUrl(req.getImageUrl());
        w.setContactPhone(req.getContactPhone());
        w.setUserId(req.getUserId());
        return mapToResponse(wholesaleItemRepository.save(w));
    }

    public WholesaleItemResponse updateItem(Long id, WholesaleItemRequest req) {
        WholesaleItem w = wholesaleItemRepository.findById(id).orElseThrow(() -> new RuntimeException("Item not found"));
        w.setTitle(req.getTitle());
        w.setCategory(req.getCategory());
        w.setDescription(req.getDescription());
        w.setPrice(req.getPrice());
        w.setPriceUnit(req.getPriceUnit());
        w.setMinQuantity(req.getMinQuantity());
        w.setLocation(req.getLocation());
        w.setSupplierName(req.getSupplierName());
        w.setImageUrl(req.getImageUrl());
        w.setContactPhone(req.getContactPhone());
        return mapToResponse(wholesaleItemRepository.save(w));
    }

    public List<WholesaleItemResponse> getAllItems() {
        return wholesaleItemRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    public WholesaleItemResponse getItemById(Long id) {
        return mapToResponse(wholesaleItemRepository.findById(id).orElseThrow(() -> new RuntimeException("Item not found")));
    }

    public void deleteItem(Long id) {
        wholesaleItemRepository.deleteById(id);
    }

    private WholesaleItemResponse mapToResponse(WholesaleItem w) {
        return WholesaleItemResponse.builder()
                .id(w.getId()).title(w.getTitle()).category(w.getCategory())
                .description(w.getDescription()).price(w.getPrice()).priceUnit(w.getPriceUnit())
                .minQuantity(w.getMinQuantity()).location(w.getLocation())
                .supplierName(w.getSupplierName()).imageUrl(w.getImageUrl())
                .contactPhone(w.getContactPhone()).userId(w.getUserId())
                .createdAt(w.getCreatedAt()).build();
    }
}

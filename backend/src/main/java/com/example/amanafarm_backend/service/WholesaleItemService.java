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
    private final CurrentUser currentUser;
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
        MediaService.validateUrl(req.getImageUrl());
        w.setImageUrl(req.getImageUrl());
        w.setContactPhone(req.getContactPhone());
        w.setUserId(currentUser.require().getId());
        return mapToResponse(wholesaleItemRepository.save(w));
    }

    public WholesaleItemResponse updateItem(Long id, WholesaleItemRequest req) {
        WholesaleItem w = wholesaleItemRepository.findById(id).orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,"Annonce introuvable"));
        currentUser.assertOwner(w.getUserId());
        w.setTitle(req.getTitle());
        w.setCategory(req.getCategory());
        w.setDescription(req.getDescription());
        w.setPrice(req.getPrice());
        w.setPriceUnit(req.getPriceUnit());
        w.setMinQuantity(req.getMinQuantity());
        w.setLocation(req.getLocation());
        w.setSupplierName(req.getSupplierName());
        MediaService.validateUrl(req.getImageUrl());
        w.setImageUrl(req.getImageUrl());
        w.setContactPhone(req.getContactPhone());
        return mapToResponse(wholesaleItemRepository.save(w));
    }

    public List<WholesaleItemResponse> getAllItems() {
        return wholesaleItemRepository.findAll().stream().map(this::mapToResponse).toList();
    }

    public WholesaleItemResponse getItemById(Long id) {
        return mapToResponse(wholesaleItemRepository.findById(id).orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,"Annonce introuvable")));
    }

    public void deleteItem(Long id) {
        var item = wholesaleItemRepository.findById(id).orElseThrow(()->new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,"Annonce introuvable"));
        currentUser.assertOwner(item.getUserId());
        wholesaleItemRepository.delete(item);
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

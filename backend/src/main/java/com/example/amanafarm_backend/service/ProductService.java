package com.example.amanafarm_backend.service;
import com.example.amanafarm_backend.dto.ProductRequest;
import com.example.amanafarm_backend.dto.ProductResponse;
import com.example.amanafarm_backend.model.Product;
import com.example.amanafarm_backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {
    private final CurrentUser currentUser;
    private final ProductRepository productRepository;

    public ProductResponse createProduct(ProductRequest req) {
        Product p = new Product();
        p.setTitle(req.getTitle());
        p.setCategory(req.getCategory());
        p.setDescription(req.getDescription());
        p.setPrice(req.getPrice());
        p.setPriceType(req.getPriceType());
        p.setUnit(req.getUnit());
        p.setQuantity(req.getQuantity());
        p.setOrigin(req.getOrigin());
        p.setLocation(req.getLocation());
        p.setWilaya(req.getWilaya());
        MediaService.validateUrl(req.getImageUrl());
        p.setImageUrl(req.getImageUrl());
        p.setContactPhone(req.getContactPhone());
        p.setInStock(req.getInStock());
        p.setFeatured(false);
        p.setDeliveryAvailable(req.getDeliveryAvailable());
        p.setCertified(req.getCertified());
        p.setSellerType(req.getSellerType());
        p.setCompanyName(req.getCompanyName());
        p.setCompanyTagline(req.getCompanyTagline());
        p.setCompanyVerified(false);
        p.setSellerName(currentUser.name());
        p.setSellerVerified(false);
        p.setSellerRating(null);
        p.setUserId(currentUser.require().getId());
        return mapToResponse(productRepository.save(p));
    }

    public ProductResponse updateProduct(Long id, ProductRequest req) {
        Product p = productRepository.findById(id).orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,"Annonce introuvable"));
        currentUser.assertOwner(p.getUserId());
        p.setTitle(req.getTitle());
        p.setCategory(req.getCategory());
        p.setDescription(req.getDescription());
        p.setPrice(req.getPrice());
        p.setPriceType(req.getPriceType());
        p.setUnit(req.getUnit());
        p.setQuantity(req.getQuantity());
        p.setOrigin(req.getOrigin());
        p.setLocation(req.getLocation());
        p.setWilaya(req.getWilaya());
        MediaService.validateUrl(req.getImageUrl());
        p.setImageUrl(req.getImageUrl());
        p.setContactPhone(req.getContactPhone());
        p.setInStock(req.getInStock());

        p.setDeliveryAvailable(req.getDeliveryAvailable());
        p.setCertified(req.getCertified());
        p.setSellerType(req.getSellerType());
        p.setCompanyName(req.getCompanyName());
        p.setCompanyTagline(req.getCompanyTagline());

        p.setSellerName(currentUser.name());


        return mapToResponse(productRepository.save(p));
    }

    public List<ProductResponse> getAllProducts() {
        return productRepository.findAllByOrderByCreatedAtDesc().stream().map(this::mapToResponse).toList();
    }

    public ProductResponse getProductById(Long id) {
        return mapToResponse(productRepository.findById(id).orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,"Annonce introuvable")));
    }

    public void deleteProduct(Long id) {
        var item = productRepository.findById(id).orElseThrow(()->new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.NOT_FOUND,"Annonce introuvable"));
        currentUser.assertOwner(item.getUserId());
        productRepository.delete(item);
    }

    private ProductResponse mapToResponse(Product p) {
        return ProductResponse.builder()
                .id(p.getId()).title(p.getTitle()).category(p.getCategory())
                .description(p.getDescription()).price(p.getPrice()).priceType(p.getPriceType())
                .unit(p.getUnit()).quantity(p.getQuantity()).origin(p.getOrigin())
                .location(p.getLocation()).wilaya(p.getWilaya()).imageUrl(p.getImageUrl())
                .contactPhone(p.getContactPhone()).inStock(p.getInStock()).featured(p.getFeatured())
                .deliveryAvailable(p.getDeliveryAvailable()).certified(p.getCertified())
                .sellerType(p.getSellerType()).companyName(p.getCompanyName())
                .companyTagline(p.getCompanyTagline()).companyVerified(p.getCompanyVerified())
                .sellerName(p.getSellerName()).sellerVerified(p.getSellerVerified())
                .sellerRating(p.getSellerRating()).userId(p.getUserId())
                .createdAt(p.getCreatedAt()).build();
    }
}

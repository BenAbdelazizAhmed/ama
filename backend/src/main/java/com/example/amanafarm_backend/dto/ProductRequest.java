package com.example.amanafarm_backend.dto;
import lombok.Data;

@Data
public class ProductRequest {
    private String title;
    private String category;
    private String description;
    private Double price;
    private String priceType;
    private String unit;
    private String quantity;
    private String origin;
    private String location;
    private String wilaya;
    private String imageUrl;
    private String contactPhone;
    private Boolean inStock;
    private Boolean featured;
    private Boolean deliveryAvailable;
    private Boolean certified;
    private String sellerType;
    private String companyName;
    private String companyTagline;
    private Boolean companyVerified;
    private String sellerName;
    private Boolean sellerVerified;
    private String sellerRating;
    private Long userId;
}

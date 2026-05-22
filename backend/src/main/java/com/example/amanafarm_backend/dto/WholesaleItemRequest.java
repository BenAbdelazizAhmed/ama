package com.example.amanafarm_backend.dto;
import lombok.Data;

@Data
public class WholesaleItemRequest {
    private String title;
    private String category;
    private String description;
    private Double price;
    private String priceUnit;
    private Integer minQuantity;
    private String location;
    private String supplierName;
    private String imageUrl;
    private String contactPhone;
    private Long userId;
}

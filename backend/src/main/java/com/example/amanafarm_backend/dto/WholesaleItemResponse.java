package com.example.amanafarm_backend.dto;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data @Builder
public class WholesaleItemResponse {
    private Long id;
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
    private LocalDateTime createdAt;
}

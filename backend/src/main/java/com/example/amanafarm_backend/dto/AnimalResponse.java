package com.example.amanafarm_backend.dto;

import lombok.Builder;
import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class AnimalResponse {
    private Long id;
    private String title;
    private String description;
    private String category;
    private BigDecimal price;
    private String priceType;
    private String wilaya;
    private String zone;
    private String age;
    private String gender;
    private String healthStatus;
    private String phone;
    private String contactMethod;
    private Boolean deliveryAvailable;
    private Boolean vetCertificate;
    private Boolean featured;
    private Boolean trustedSeller;
    private String status;
    private Long userId;
    private LocalDateTime createdAt;
    private List<String> images;
}

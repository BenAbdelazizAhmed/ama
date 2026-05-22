package com.example.amanafarm_backend.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class AnimalRequest {
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
    private Long userId;
    private List<String> images;
}

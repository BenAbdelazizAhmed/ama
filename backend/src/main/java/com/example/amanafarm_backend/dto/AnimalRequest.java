package com.example.amanafarm_backend.dto;

import lombok.Data;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.util.List;

@Data
public class AnimalRequest {
    @NotBlank @Size(min=3,max=140)
    private String title;
    @NotBlank @Size(min=10,max=4000)
    private String description;
    @NotBlank @Size(max=40)
    private String category;
    @NotNull @DecimalMin("0") @DecimalMax("100000000")
    private BigDecimal price;
    private String priceType;
    @NotBlank @Size(max=40)
    private String wilaya;
    private String zone;
    private String age;
    private String gender;
    private String healthStatus;
    @NotBlank @Pattern(regexp="[2459][0-9]{7}")
    private String phone;
    private String contactMethod;
    private Boolean deliveryAvailable;
    private Boolean vetCertificate;
    private Boolean featured;
    private Boolean trustedSeller;
    private Long userId;
    @Size(max=6)
    private List<String> images;
}

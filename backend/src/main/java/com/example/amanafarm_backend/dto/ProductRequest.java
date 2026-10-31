package com.example.amanafarm_backend.dto;
import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class ProductRequest {
    @NotBlank @Size(min=3,max=140)
    private String title;
    @NotBlank @Size(max=40)
    private String category;
    @NotBlank @Size(min=10,max=4000)
    private String description;
    @NotNull @DecimalMin("0") @DecimalMax("100000000")
    private Double price;
    private String priceType;
    private String unit;
    private String quantity;
    private String origin;
    private String location;
    @NotBlank @Size(max=40)
    private String wilaya;
    @Size(max=2048)
    private String imageUrl;
    @NotBlank @Pattern(regexp="[2459][0-9]{7}")
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

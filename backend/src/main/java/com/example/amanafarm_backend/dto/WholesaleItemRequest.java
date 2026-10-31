package com.example.amanafarm_backend.dto;
import lombok.Data;
import jakarta.validation.constraints.*;

@Data
public class WholesaleItemRequest {
    @NotBlank @Size(min=3,max=140)
    private String title;
    @NotBlank @Size(max=40)
    private String category;
    @NotBlank @Size(min=10,max=4000)
    private String description;
    @NotNull @DecimalMin("0") @DecimalMax("100000000")
    private Double price;
    private String priceUnit;
    @NotNull @Min(1) @Max(1000000)
    private Integer minQuantity;
    @NotBlank @Size(max=40)
    private String location;
    private String supplierName;
    @Size(max=2048)
    private String imageUrl;
    @NotBlank @Pattern(regexp="[2459][0-9]{7}")
    private String contactPhone;
    private Long userId;
}

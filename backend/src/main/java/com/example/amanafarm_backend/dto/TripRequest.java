package com.example.amanafarm_backend.dto;
import jakarta.validation.constraints.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TripRequest(
    @NotBlank @Size(max = 40) String origin,
    @NotBlank @Size(max = 40) String destination,
    @NotNull LocalDateTime departure,
    @NotBlank @Size(max = 40) String animalType,
    @Min(1) @Max(200) int capacity,
    @NotNull @DecimalMin("0.00") @DecimalMax("10000.00") @Digits(integer = 5, fraction = 2) BigDecimal price,
    @NotBlank @Size(max = 60) String vehicle,
    @Size(max = 1000) String notes,
    @NotBlank @Pattern(regexp = "[2459][0-9]{7}") String contactPhone,
    boolean accompanied
) {}

package com.example.amanafarm_backend.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "animals")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Animal {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @Column(columnDefinition = "TEXT")
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

    @Builder.Default
    private Boolean deliveryAvailable = false;

    @Builder.Default
    private Boolean vetCertificate = false;

    @Builder.Default
    private Boolean featured = false;

    @Builder.Default
    private Boolean trustedSeller = false;

    @Builder.Default
    private String status = "ACTIVE";

    private Long userId;

    private LocalDateTime createdAt;

    @Builder.Default
    @OneToMany(mappedBy = "animal", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<AnimalImage> images = new ArrayList<>();

    @PrePersist
    public void prePersist() {
        createdAt = LocalDateTime.now();
    }
}

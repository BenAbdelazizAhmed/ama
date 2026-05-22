package com.example.amanafarm_backend.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "wholesale_items")
public class WholesaleItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
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

    public WholesaleItem() {}

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public Double getPrice() { return price; }
    public String getPriceUnit() { return priceUnit; }
    public Integer getMinQuantity() { return minQuantity; }
    public String getLocation() { return location; }
    public String getSupplierName() { return supplierName; }
    public String getImageUrl() { return imageUrl; }
    public String getContactPhone() { return contactPhone; }
    public Long getUserId() { return userId; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setCategory(String category) { this.category = category; }
    public void setDescription(String description) { this.description = description; }
    public void setPrice(Double price) { this.price = price; }
    public void setPriceUnit(String priceUnit) { this.priceUnit = priceUnit; }
    public void setMinQuantity(Integer minQuantity) { this.minQuantity = minQuantity; }
    public void setLocation(String location) { this.location = location; }
    public void setSupplierName(String supplierName) { this.supplierName = supplierName; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @PrePersist
    public void prePersist() { createdAt = LocalDateTime.now(); }
}

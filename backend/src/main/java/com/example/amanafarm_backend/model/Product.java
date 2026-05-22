package com.example.amanafarm_backend.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "products")
public class Product {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    private String category;
    private String description;
    private Double price;
    private String priceType;
    private String unit;
    private String quantity;
    private String origin;
    private String location;
    private String wilaya;
    @Lob
    @Column(columnDefinition = "LONGTEXT")
    private String imageUrl;
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
    private LocalDateTime createdAt;

    public Product() {}

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getCategory() { return category; }
    public String getDescription() { return description; }
    public Double getPrice() { return price; }
    public String getPriceType() { return priceType; }
    public String getUnit() { return unit; }
    public String getQuantity() { return quantity; }
    public String getOrigin() { return origin; }
    public String getLocation() { return location; }
    public String getWilaya() { return wilaya; }
    public String getImageUrl() { return imageUrl; }
    public String getContactPhone() { return contactPhone; }
    public Boolean getInStock() { return inStock; }
    public Boolean getFeatured() { return featured; }
    public Boolean getDeliveryAvailable() { return deliveryAvailable; }
    public Boolean getCertified() { return certified; }
    public String getSellerType() { return sellerType; }
    public String getCompanyName() { return companyName; }
    public String getCompanyTagline() { return companyTagline; }
    public Boolean getCompanyVerified() { return companyVerified; }
    public String getSellerName() { return sellerName; }
    public Boolean getSellerVerified() { return sellerVerified; }
    public String getSellerRating() { return sellerRating; }
    public Long getUserId() { return userId; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setCategory(String category) { this.category = category; }
    public void setDescription(String description) { this.description = description; }
    public void setPrice(Double price) { this.price = price; }
    public void setPriceType(String priceType) { this.priceType = priceType; }
    public void setUnit(String unit) { this.unit = unit; }
    public void setQuantity(String quantity) { this.quantity = quantity; }
    public void setOrigin(String origin) { this.origin = origin; }
    public void setLocation(String location) { this.location = location; }
    public void setWilaya(String wilaya) { this.wilaya = wilaya; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public void setContactPhone(String contactPhone) { this.contactPhone = contactPhone; }
    public void setInStock(Boolean inStock) { this.inStock = inStock; }
    public void setFeatured(Boolean featured) { this.featured = featured; }
    public void setDeliveryAvailable(Boolean deliveryAvailable) { this.deliveryAvailable = deliveryAvailable; }
    public void setCertified(Boolean certified) { this.certified = certified; }
    public void setSellerType(String sellerType) { this.sellerType = sellerType; }
    public void setCompanyName(String companyName) { this.companyName = companyName; }
    public void setCompanyTagline(String companyTagline) { this.companyTagline = companyTagline; }
    public void setCompanyVerified(Boolean companyVerified) { this.companyVerified = companyVerified; }
    public void setSellerName(String sellerName) { this.sellerName = sellerName; }
    public void setSellerVerified(Boolean sellerVerified) { this.sellerVerified = sellerVerified; }
    public void setSellerRating(String sellerRating) { this.sellerRating = sellerRating; }
    public void setUserId(Long userId) { this.userId = userId; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    @PrePersist
    public void prePersist() { createdAt = LocalDateTime.now(); }
}

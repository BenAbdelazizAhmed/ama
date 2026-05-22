package com.example.amanafarm_backend.model;
import jakarta.persistence.*;

@Entity
public class Worker {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String title;
    private String location;
    private String experience;

    private Double rating;
    private Integer reviewCount;
    private Integer completedJobs;

    private String responseTime;
    private Integer price;
    private String priceUnit;

    private Boolean available;

    @Column(length = 1000)
    private String skills;

    private String avatarUrl;
    private String coverUrl;
    private String phone;

    @Column(length = 2000)
    private String description;

    public Worker() {
    }

    public Worker(Long id, String name, String title, String location, String experience, Double rating,
                  Integer reviewCount, Integer completedJobs, String responseTime, Integer price,
                  String priceUnit, Boolean available, String skills, String avatarUrl,
                  String coverUrl, String phone, String description) {
        this.id = id;
        this.name = name;
        this.title = title;
        this.location = location;
        this.experience = experience;
        this.rating = rating;
        this.reviewCount = reviewCount;
        this.completedJobs = completedJobs;
        this.responseTime = responseTime;
        this.price = price;
        this.priceUnit = priceUnit;
        this.available = available;
        this.skills = skills;
        this.avatarUrl = avatarUrl;
        this.coverUrl = coverUrl;
        this.phone = phone;
        this.description = description;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getTitle() { return title; }
    public String getLocation() { return location; }
    public String getExperience() { return experience; }
    public Double getRating() { return rating; }
    public Integer getReviewCount() { return reviewCount; }
    public Integer getCompletedJobs() { return completedJobs; }
    public String getResponseTime() { return responseTime; }
    public Integer getPrice() { return price; }
    public String getPriceUnit() { return priceUnit; }
    public Boolean getAvailable() { return available; }
    public String getSkills() { return skills; }
    public String getAvatarUrl() { return avatarUrl; }
    public String getCoverUrl() { return coverUrl; }
    public String getPhone() { return phone; }
    public String getDescription() { return description; }

    public void setId(Long id) { this.id = id; }
    public void setName(String name) { this.name = name; }
    public void setTitle(String title) { this.title = title; }
    public void setLocation(String location) { this.location = location; }
    public void setExperience(String experience) { this.experience = experience; }
    public void setRating(Double rating) { this.rating = rating; }
    public void setReviewCount(Integer reviewCount) { this.reviewCount = reviewCount; }
    public void setCompletedJobs(Integer completedJobs) { this.completedJobs = completedJobs; }
    public void setResponseTime(String responseTime) { this.responseTime = responseTime; }
    public void setPrice(Integer price) { this.price = price; }
    public void setPriceUnit(String priceUnit) { this.priceUnit = priceUnit; }
    public void setAvailable(Boolean available) { this.available = available; }
    public void setSkills(String skills) { this.skills = skills; }
    public void setAvatarUrl(String avatarUrl) { this.avatarUrl = avatarUrl; }
    public void setCoverUrl(String coverUrl) { this.coverUrl = coverUrl; }
    public void setPhone(String phone) { this.phone = phone; }
    public void setDescription(String description) { this.description = description; }
}

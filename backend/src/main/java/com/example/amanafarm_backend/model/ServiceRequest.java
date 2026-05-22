package com.example.amanafarm_backend.model;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
public class ServiceRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String requestTitle;
    private String region;
    private String serviceType;

    @Column(length = 2000)
    private String details;

    private Integer budget;
    private String period;
    private String availability;
    private String status;
    private LocalDateTime createdAt;

    public ServiceRequest() {
    }

    public Long getId() { return id; }
    public String getRequestTitle() { return requestTitle; }
    public String getRegion() { return region; }
    public String getServiceType() { return serviceType; }
    public String getDetails() { return details; }
    public Integer getBudget() { return budget; }
    public String getPeriod() { return period; }
    public String getAvailability() { return availability; }
    public String getStatus() { return status; }
    public LocalDateTime getCreatedAt() { return createdAt; }

    public void setId(Long id) { this.id = id; }
    public void setRequestTitle(String requestTitle) { this.requestTitle = requestTitle; }
    public void setRegion(String region) { this.region = region; }
    public void setServiceType(String serviceType) { this.serviceType = serviceType; }
    public void setDetails(String details) { this.details = details; }
    public void setBudget(Integer budget) { this.budget = budget; }
    public void setPeriod(String period) { this.period = period; }
    public void setAvailability(String availability) { this.availability = availability; }
    public void setStatus(String status) { this.status = status; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}

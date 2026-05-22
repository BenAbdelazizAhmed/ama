package com.example.amanafarm_backend.model;
import jakarta.persistence.*;

@Entity
public class JobOffer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String employer;
    private String logo;
    private String location;
    private String jobType;
    private String salary;
    private String period;
    private String badge;
    private String badgeText;

    @Column(length = 2000)
    private String description;

    @Column(length = 1000)
    private String tags;

    private String deadline;

    public JobOffer() {
    }

    public Long getId() { return id; }
    public String getTitle() { return title; }
    public String getEmployer() { return employer; }
    public String getLogo() { return logo; }
    public String getLocation() { return location; }
    public String getJobType() { return jobType; }
    public String getSalary() { return salary; }
    public String getPeriod() { return period; }
    public String getBadge() { return badge; }
    public String getBadgeText() { return badgeText; }
    public String getDescription() { return description; }
    public String getTags() { return tags; }
    public String getDeadline() { return deadline; }

    public void setId(Long id) { this.id = id; }
    public void setTitle(String title) { this.title = title; }
    public void setEmployer(String employer) { this.employer = employer; }
    public void setLogo(String logo) { this.logo = logo; }
    public void setLocation(String location) { this.location = location; }
    public void setJobType(String jobType) { this.jobType = jobType; }
    public void setSalary(String salary) { this.salary = salary; }
    public void setPeriod(String period) { this.period = period; }
    public void setBadge(String badge) { this.badge = badge; }
    public void setBadgeText(String badgeText) { this.badgeText = badgeText; }
    public void setDescription(String description) { this.description = description; }
    public void setTags(String tags) { this.tags = tags; }
    public void setDeadline(String deadline) { this.deadline = deadline; }
}

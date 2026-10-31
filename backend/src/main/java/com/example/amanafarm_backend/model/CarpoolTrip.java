package com.example.amanafarm_backend.model;
import jakarta.persistence.*;

@Entity
@Table(name = "carpool_trips", indexes = @Index(name = "idx_trip_departure", columnList = "departure"))
public class CarpoolTrip {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false)
    private String origin;
    @Column(nullable = false)
    private String destination;
    @Column(nullable = false)
    private java.time.LocalDateTime departure;
    @Column(nullable = false)
    private String animalType;
    @Column(nullable = false)
    private int capacity;
    @Column(nullable = false, precision = 10, scale = 2)
    private java.math.BigDecimal price;
    @Column(nullable = false)
    private String vehicle;
    @Column(length = 1000)
    private String notes;
    @Column(nullable = false)
    private String contactPhone;
    @Column(nullable = false)
    private String driverName;
    @Column(nullable = false)
    private Long ownerId;
    @Column(nullable = false)
    private boolean accompanied;
    public Long getId() { return id; }
    public void setId(Long value) { this.id = value; }
    public String getOrigin() { return origin; }
    public void setOrigin(String value) { this.origin = value; }
    public String getDestination() { return destination; }
    public void setDestination(String value) { this.destination = value; }
    public java.time.LocalDateTime getDeparture() { return departure; }
    public void setDeparture(java.time.LocalDateTime value) { this.departure = value; }
    public String getAnimalType() { return animalType; }
    public void setAnimalType(String value) { this.animalType = value; }
    public int getCapacity() { return capacity; }
    public void setCapacity(int value) { this.capacity = value; }
    public java.math.BigDecimal getPrice() { return price; }
    public void setPrice(java.math.BigDecimal value) { this.price = value; }
    public String getVehicle() { return vehicle; }
    public void setVehicle(String value) { this.vehicle = value; }
    public String getNotes() { return notes; }
    public void setNotes(String value) { this.notes = value; }
    public String getContactPhone() { return contactPhone; }
    public void setContactPhone(String value) { this.contactPhone = value; }
    public String getDriverName() { return driverName; }
    public void setDriverName(String value) { this.driverName = value; }
    public Long getOwnerId() { return ownerId; }
    public void setOwnerId(Long value) { this.ownerId = value; }
    public boolean getAccompanied() { return accompanied; }
    public void setAccompanied(boolean value) { this.accompanied = value; }
}

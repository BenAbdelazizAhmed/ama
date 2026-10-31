package com.example.amanafarm_backend.model;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
@Entity @Getter @Setter
@Table(name="favorites",uniqueConstraints=@UniqueConstraint(columnNames={"user_id","kind","listing_id"}))
public class Favorite {
 @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
 @Column(name="user_id",nullable=false) private Long userId;
 @Column(nullable=false,length=20) private String kind;
 @Column(name="listing_id",nullable=false) private Long listingId;
}

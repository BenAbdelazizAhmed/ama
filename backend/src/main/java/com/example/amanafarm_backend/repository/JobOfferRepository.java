package com.example.amanafarm_backend.repository;

import com.example.amanafarm_backend.model.JobOffer;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface JobOfferRepository extends JpaRepository<JobOffer, Long> {

    List<JobOffer> findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(
            String title,
            String description
    );

    List<JobOffer> findByLocationContainingIgnoreCase(String location);
}
